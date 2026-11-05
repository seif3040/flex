'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const WELCOME_DRAFT_KEY = 'flex.welcome-draft';

export function WelcomePrompt({ projectId }: { projectId?: string } = {}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);

  return (
    <form className="flex w-full flex-col gap-3" onSubmit={(event) => {
      event.preventDefault();
      if (!draft.trim()) return;
      try {
        sessionStorage.setItem(WELCOME_DRAFT_KEY, draft.trim());
        router.push(projectId ? `/c/new?project=${encodeURIComponent(projectId)}` : '/c/new');
      } catch {
        setError(true);
      }
    }}>
      <textarea
        aria-label="Ask Flex anything"
        dir="auto"
        className="min-h-20 w-full rounded-xl border bg-background p-3"
        placeholder="Ask Flex anything…"
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setError(false); }}
      />
      {error && <p role="alert" className="text-sm">Flex couldn’t carry this draft into a new chat.</p>}
      <Button className="self-end" type="submit" disabled={!draft.trim()}>Continue to chat</Button>
    </form>
  );
}
