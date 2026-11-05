import { NextResponse } from 'next/server';
import { apiKeySchema } from '@/schemas/keys';
import { encryptKey } from '@/lib/crypto/keys';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function GET() {
  const user = await getUserOrResponse();
  if (user instanceof NextResponse) return user;
  const supabase = await createClient();
  const { data, error } = await supabase.from('api_keys').select('key_hint,label,created_at').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to read key metadata' } }, { status: 500 });
  return NextResponse.json({ data: data ? { hint: data.key_hint, label: data.label, createdAt: data.created_at } : null });
}

export async function POST(request: Request) {
  const user = await getUserOrResponse();
  if (user instanceof NextResponse) return user;
  const rate = checkRateLimit(`keys:${user.id}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Key update limit reached' } }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const parsed = apiKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid OpenRouter API key', details: parsed.error.flatten() } }, { status: 400 });
  const supabase = await createClient();
  const key = parsed.data.key;
  let encryptedKey: string;
  try { encryptedKey = encryptKey(key); } catch { return NextResponse.json({ error: { code: 'CONFIGURATION_ERROR', message: 'Server encryption is not configured. Add KEY_ENCRYPTION_SECRET and restart the app.' } }, { status: 503 }); }
  const { data, error } = await supabase.from('api_keys').upsert({ user_id: user.id, encrypted_key: encryptedKey, key_hint: `...${key.slice(-4)}`, label: 'Default' }, { onConflict: 'user_id' }).select('key_hint,label,created_at').single();
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to save API key' } }, { status: 500 });
  return NextResponse.json({ data: { hint: data.key_hint, label: data.label, createdAt: data.created_at } }, { status: 201 });
}

export async function DELETE() {
  const user = await getUserOrResponse();
  if (user instanceof NextResponse) return user;
  const supabase = await createClient();
  const { error } = await supabase.from('api_keys').delete().eq('user_id', user.id);
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to delete API key' } }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

async function getUserOrResponse() {
  try { return await requireServerUser(); } catch { return createUnauthorizedResponse(); }
}
