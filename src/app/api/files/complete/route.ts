import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { sanitizeFilename, validateFile } from '@/lib/files/validate';
import { extractText } from '@/lib/files/extract';

export async function POST(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const input = await request.json().catch(() => null) as { path?: string; name?: string; type?: string; size?: number; conversationId?: string } | null;
  if (!input?.path || !input.name || !input.type || typeof input.size !== 'number' || !input.path.startsWith(`${user.id}/`)) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid uploaded file' } }, { status: 400 });
  const conversationId = input.conversationId ?? ''; const supabase = await createClient();
  if (conversationId) { const { data: conversation } = await supabase.from('conversations').select('id').eq('id', conversationId).eq('user_id', user.id).maybeSingle(); if (!conversation) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Conversation not found' } }, { status: 403 }); }
  let storageClient = supabase; let downloaded = await storageClient.storage.from('user-uploads').download(input.path);
  if (downloaded.error) { try { storageClient = createAdminClient(); downloaded = await storageClient.storage.from('user-uploads').download(input.path); } catch { return NextResponse.json({ error: { code: 'STORAGE_ERROR', message: 'Unable to read uploaded file' } }, { status: 500 }); } }
  if (downloaded.error || !downloaded.data) return NextResponse.json({ error: { code: 'STORAGE_ERROR', message: 'Unable to read uploaded file' } }, { status: 500 });
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  try { validateFile({ size: input.size, type: input.type, bytes }); } catch (error) { await storageClient.storage.from('user-uploads').remove([input.path]); const message = error instanceof Error ? error.message : 'Invalid file'; return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status: 400 }); }
  let extractedText: string | null = null; try { extractedText = (await extractText(input.type, bytes))?.slice(0, 500000) ?? null; } catch { await storageClient.storage.from('user-uploads').remove([input.path]); return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Unable to extract text from file' } }, { status: 400 }); }
  const { data, error } = await supabase.from('files').insert({ user_id: user.id, conversation_id: conversationId || null, storage_path: input.path, original_name: sanitizeFilename(input.name), mime_type: input.type, size_bytes: input.size, extracted_text: extractedText }).select().single();
  if (error) { await storageClient.storage.from('user-uploads').remove([input.path]); return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to save file metadata' } }, { status: 500 }); }
  return NextResponse.json({ data }, { status: 201 });
}
