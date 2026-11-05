import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { InvalidFileTypeError, FileTooLargeError, sanitizeFilename, validateFile } from '@/lib/files/validate';
import { extractText } from '@/lib/files/extract';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const rate = checkRateLimit(`files:${user.id}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Upload limit reached' } }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid multipart form data' } }, { status: 400 });
  }
  const input = form.get('file');
  if (!(input instanceof File)) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'A file is required' } }, { status: 400 });
  const bytes = new Uint8Array(await input.arrayBuffer());
  try { validateFile({ size: input.size, type: input.type, bytes }); } catch (error) { const message = error instanceof Error ? error.message : 'Invalid file'; const status = error instanceof FileTooLargeError || error instanceof InvalidFileTypeError ? 400 : 500; return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status }); }
  const conversationId = String(form.get('conversationId') ?? ''); const safeName = sanitizeFilename(input.name); const path = `${user.id}/${conversationId || 'unattached'}/${crypto.randomUUID()}-${safeName}`; const supabase = await createClient();
  if (conversationId) { const { data: conversation } = await supabase.from('conversations').select('id').eq('id', conversationId).eq('user_id', user.id).maybeSingle(); if (!conversation) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Conversation not found' } }, { status: 403 }); }
  const upload = await supabase.storage.from('user-uploads').upload(path, bytes, { contentType: input.type, upsert: false }); if (upload.error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to store file' } }, { status: 500 });
  let extractedText: string | null = null; try { extractedText = (await extractText(input.type, bytes))?.slice(0, 500000) ?? null; } catch { await supabase.storage.from('user-uploads').remove([path]); return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Unable to extract text from file' } }, { status: 400 }); }
  const { data, error } = await supabase.from('files').insert({ user_id: user.id, conversation_id: conversationId || null, storage_path: path, original_name: safeName, mime_type: input.type, size_bytes: input.size, extracted_text: extractedText }).select().single(); if (error) { await supabase.storage.from('user-uploads').remove([path]); return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to save file metadata' } }, { status: 500 }); } return NextResponse.json({ data }, { status: 201 });
}
