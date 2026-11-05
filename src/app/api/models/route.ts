import { NextResponse } from 'next/server';
import { decryptKey } from '@/lib/crypto/keys';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { fetchModels } from '@/lib/openrouter/models';

const cache = new Map<string, { expiresAt: number; models: Awaited<ReturnType<typeof fetchModels>> }>();

export async function GET(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const supabase = await createClient();
  const { data: key, error } = await supabase.from('api_keys').select('encrypted_key').eq('user_id', user.id).maybeSingle();
  if (error || !key) return NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Save an OpenRouter API key first' } }, { status: 502 });
  const now = Date.now(); let cached = cache.get(user.id);
  try {
    if (!cached || cached.expiresAt <= now) { cached = { expiresAt: now + 5 * 60 * 1000, models: await fetchModels(decryptKey(key.encrypted_key)) }; cache.set(user.id, cached); }
  } catch { return NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Unable to load OpenRouter models' } }, { status: 502 }); }
  const freeOnly = new URL(request.url).searchParams.get('free') === 'true';
  return NextResponse.json({ data: { models: freeOnly ? cached.models.filter((model) => model.isFree) : cached.models, cachedAt: new Date(now).toISOString() } });
}
