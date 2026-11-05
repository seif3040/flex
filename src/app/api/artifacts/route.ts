import { NextResponse } from 'next/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  let user;
  try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const conversationId = new URL(request.url).searchParams.get('conversationId');
  const supabase = await createClient();
  let query = supabase.from('artifacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (conversationId) query = query.eq('conversation_id', conversationId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to list artifacts' } }, { status: 500 });
  return NextResponse.json({ data: { artifacts: data } });
}
