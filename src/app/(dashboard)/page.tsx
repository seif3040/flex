import Link from 'next/link';
import { WelcomePrompt } from '@/components/chat/WelcomePrompt';

export default function DashboardHome() {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col px-5 py-6 sm:px-12 md:min-h-dvh">
      <p className="text-xs text-muted-foreground">Workspace / Welcome</p>
      <div className="mt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to Flex</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start with a question, a file, or a clear outcome.</p>
      </div>
      <div className="mt-8 flex min-h-48 flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Ask Flex anything</h2>
          <p className="mt-2 text-sm text-muted-foreground">Research a topic, draft something, or work with a file.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/settings#workspace-data" className="rounded-2xl border bg-card p-4 hover:bg-accent">
          <h2 className="text-sm font-medium">Context</h2>
          <p className="mt-2 text-sm text-muted-foreground">Manage projects and memory in Settings.</p>
        </Link>
        <Link href="/artifacts" className="rounded-2xl border bg-card p-4 hover:bg-accent">
          <h2 className="text-sm font-medium">Recent work</h2>
          <p className="mt-2 text-sm text-muted-foreground">Open code and previews saved from your chats.</p>
        </Link>
        <Link href="/settings#models" className="rounded-2xl border bg-card p-4 hover:bg-accent">
          <h2 className="text-sm font-medium">OpenRouter</h2>
          <p className="mt-2 text-sm text-muted-foreground">Connect your key to use free models.</p>
        </Link>
      </div>
      <div className="mt-auto pt-8">
        <div className="rounded-2xl border bg-card p-3">
          <WelcomePrompt />
        </div>
      </div>
    </section>
  );
}
