import { NextResponse } from 'next/server';
import { createConversationSchema } from '@/schemas/conversation';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const query = new URL(request.url).searchParams.get('q');
  const supabase = await createClient();
  let builder = supabase.from('conversations').select('id,title,model_id,project_id,created_at,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(100);
  if (query) builder = builder.ilike('title', `%${query.replace(/[%_]/g, '')}%`);
  const { data, error } = await builder;
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to list conversations' } }, { status: 500 });
  return NextResponse.json({ data: { conversations: data.map((item) => ({ id: item.id, title: item.title, modelId: item.model_id, projectId: item.project_id, createdAt: item.created_at, updatedAt: item.updated_at })) } });
}

export async function POST(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const parsed = createConversationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid conversation', details: parsed.error.flatten() } }, { status: 400 });
  const supabase = await createClient();
  const input = parsed.data;
  if (input.projectId) {
    const { data: project, error } = await supabase.from('projects')
      .select('id').eq('id', input.projectId).eq('user_id', user.id).maybeSingle();
    if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to verify project' } }, { status: 500 });
    if (!project) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Project not found or not owned by user' } }, { status: 403 });
  }
  const { data, error } = await supabase.from('conversations').insert({ user_id: user.id, title: input.title ?? 'New Conversation', model_id: input.modelId, project_id: input.projectId, system_prompt: input.systemPrompt }).select().single();
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to create conversation' } }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
