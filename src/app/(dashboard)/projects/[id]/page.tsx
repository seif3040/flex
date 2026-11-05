import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { WelcomePrompt } from '@/components/chat/WelcomePrompt';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) notFound();
  const { id } = await params;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();

  const db = await createClient();
  const { data: project, error } = await db.from('projects')
    .select('name,description').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Unable to load project');
  if (!project) notFound();

  const { data: chats, error: chatsError } = await db.from('conversations')
    .select('id,title').eq('project_id', id).eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (chatsError) throw new Error('Unable to load project conversations');

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-12">
      <Link href="/projects" className="text-sm text-muted-foreground hover:underline">← Projects</Link>
      <h1 dir="auto" className="mt-8 break-words text-3xl font-semibold tracking-tight">{project.name}</h1>
      {project.description && <p dir="auto" className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{project.description}</p>}
      <Link href={`/c/new?project=${id}`} className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">+ New project chat</Link>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-medium">Context</h2>
          <p className="mt-2 text-sm text-muted-foreground">Chats started here are grouped in this project.</p>
        </div>
        <a href="#project-chats" className="rounded-2xl border bg-card p-4 hover:bg-accent">
          <h2 className="text-sm font-medium">Recent work</h2>
          <p className="mt-2 text-sm text-muted-foreground">{chats.length} conversations</p>
        </a>
        <a href="#project-prompt" className="rounded-2xl border bg-card p-4 hover:bg-accent">
          <h2 className="text-sm font-medium">Next step</h2>
          <p className="mt-2 text-sm text-muted-foreground">Draft a message for this project.</p>
        </a>
      </div>
      <section id="project-chats" className="mt-8 scroll-mt-20 rounded-2xl border bg-card p-5">
        <h2 className="font-medium">Project conversations</h2>
        {chats.length ? (
          <ul className="mt-4 space-y-2">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link dir="auto" className="block break-words rounded-lg border p-3 hover:bg-accent" href={`/c/${chat.id}`}>
                  {chat.title || 'New chat'}
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">No conversations in this project yet.</p>}
      </section>
      <div id="project-prompt" className="mt-6 scroll-mt-20 rounded-2xl border bg-card p-5">
        <WelcomePrompt projectId={id} />
      </div>
    </section>
  );
}
