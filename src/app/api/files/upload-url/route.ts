import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { InvalidFileTypeError, FileTooLargeError, sanitizeFilename, validateFileMetadata } from '@/lib/files/validate';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const rate = checkRateLimit(`files:${user.id}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Upload limit reached' } }, { status: 429 });
  const input = await request.json().catch(() => null) as { name?: string; type?: string; size?: number; conversationId?: string } | null;
  if (!input?.name || !input.type || typeof input.size !== 'number') return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'File metadata is required' } }, { status: 400 });
  try { validateFileMetadata({ size: input.size, type: input.type }); } catch (error) { const message = error instanceof Error ? error.message : 'Invalid file'; const status = error instanceof FileTooLargeError || error instanceof InvalidFileTypeError ? 400 : 500; return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status }); }
  const conversationId = input.conversationId ?? ''; const supabase = await createClient();
  if (conversationId) { const { data: conversation } = await supabase.from('conversations').select('id').eq('id', conversationId).eq('user_id', user.id).maybeSingle(); if (!conversation) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Conversation not found' } }, { status: 403 }); }
  const path = `${user.id}/${conversationId || 'unattached'}/${crypto.randomUUID()}-${sanitizeFilename(input.name)}`;
  let storageClient = supabase; let signed = await storageClient.storage.from('user-uploads').createSignedUploadUrl(path);
  if (signed.error) { try { storageClient = createAdminClient(); signed = await storageClient.storage.from('user-uploads').createSignedUploadUrl(path); } catch { return NextResponse.json({ error: { code: 'STORAGE_NOT_CONFIGURED', message: 'File storage is not configured for this workspace' } }, { status: 503 }); } }
  if (signed.error || !signed.data) return NextResponse.json({ error: { code: 'STORAGE_ERROR', message: 'Unable to prepare file upload' } }, { status: 500 });
  return NextResponse.json({ data: { path, token: signed.data.token } });
}
