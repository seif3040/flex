import { notFound } from 'next/navigation';
import { connection } from 'next/server';

export const instant = false;
import { ChatView } from '@/components/chat/ChatView';
import { createClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/auth/session';

export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ project?: string | string[] }> }) {
  await connection();
  const user = await getServerUser();
  if (!user) notFound();
  const { id } = await params;
  if (id === 'new') {
    const { project } = await searchParams;
    let projectId: string | undefined;
    if (typeof project === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(project)) {
      const supabase = await createClient();
      const { data, error } = await supabase.from('projects').select('id')
        .eq('id', project).eq('user_id', user.id).maybeSingle();
      if (error) throw new Error('Unable to load project');
      if (!data) notFound();
      projectId = data.id;
    }
    return <ChatView key={projectId ?? id} conversationId="" title="New chat" initialModel="openrouter/free" initialProjectId={projectId} initialMessages={[]} />;
  }

  const supabase = await createClient();
  const { data: conversation, error } = await supabase.from('conversations')
    .select('id,title,model_id,project_id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Unable to load conversation');
  if (!conversation) notFound();
  const { data: messages, error: messagesError } = await supabase.from('messages')
    .select('id,role,content').eq('conversation_id', conversation.id)
    .order('created_at').order('id');
  if (messagesError) throw new Error('Unable to load messages');

  return <ChatView key={id} conversationId={id} title={conversation.title ?? 'New chat'} initialModel={conversation.model_id} initialProjectId={conversation.project_id} initialMessages={messages} />;
}
