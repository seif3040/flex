'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ConversationList } from './ConversationList';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="sticky top-0 z-30 h-16 border-b bg-sidebar px-4 md:hidden">
      <div className="flex h-full items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight" onClick={close}>flex</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-workspace-menu">
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-workspace-menu" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-sidebar p-4 shadow-lg" aria-label="Mobile navigation">
          <Link className="mb-3 block rounded-xl bg-primary px-3 py-2.5 text-sm text-primary-foreground" href="/c/new" onClick={close}>+ New chat</Link>
          <Link className="block rounded-lg px-2 py-2 text-sm hover:bg-muted" href="/" onClick={close}>Workspace</Link>
          <Link className="block rounded-lg px-2 py-2 text-sm hover:bg-muted" href="/projects" onClick={close}>Projects</Link>
          <Link className="block rounded-lg px-2 py-2 text-sm hover:bg-muted" href="/memory" onClick={close}>Memory</Link>
          <Link className="block rounded-lg px-2 py-2 text-sm hover:bg-muted" href="/artifacts" onClick={close}>Artifacts</Link>
          <Link className="block rounded-lg px-2 py-2 text-sm hover:bg-muted" href="/settings" onClick={close}>Settings</Link>
          <ConversationList onNavigate={close} />
        </nav>
      )}
    </div>
  );
}
