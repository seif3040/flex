'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConversationError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-12" aria-labelledby="chat-error-title">
      <p className="text-xs text-muted-foreground">Workspace / Chat</p>
      <div className="mt-6 rounded-2xl border bg-card p-6" role="alert">
        <h1 id="chat-error-title" className="text-xl font-semibold">Could not load this chat</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try loading the conversation again.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className="text-sm underline underline-offset-4">Back to workspace</Link>
        </div>
      </div>
    </section>
  );
}
