import { NextResponse } from 'next/server';
import { updateConversationSchema } from '@/schemas/conversation';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const { id } = await context.params; const supabase = await createClient();
  const { data: conversation, error } = await supabase.from('conversations').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to read conversation' } }, { status: 500 });
  if (!conversation) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } }, { status: 404 });
  const { data: messages } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at');
  return NextResponse.json({ data: { conversation, messages: messages ?? [] } });
}

export async function PATCH(request: Request, context: Context) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const { id } = await context.params; const parsed = updateConversationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid conversation update' } }, { status: 400 });
  const supabase = await createClient(); const input = parsed.data;
  if (input.projectId) { const { data: project } = await supabase.from('projects').select('id').eq('id', input.projectId).eq('user_id', user.id).maybeSingle(); if (!project) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Project not found or not owned by user' } }, { status: 403 }); }
  const { data, error } = await supabase.from('conversations').update({ title: input.title, model_id: input.modelId, project_id: input.projectId, system_prompt: input.systemPrompt }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to update conversation' } }, { status: 500 });
  if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: Context) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const { id } = await context.params; const supabase = await createClient();
  const { error } = await supabase.from('conversations').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to delete conversation' } }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
