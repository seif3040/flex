import Link from 'next/link';
import { connection } from 'next/server';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getServerUser } from '@/lib/auth/session';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { MobileNav } from '@/components/sidebar/MobileNav';

export const instant = false;

export default async function RequestDashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return <DashboardLayout>{children}</DashboardLayout>;
}

async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-e bg-sidebar p-5 md:flex">
        <div className="mb-5 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-emerald-600 text-sm text-white">✳</span>
            flex
          </Link>
          <ThemeToggle />
        </div>
        <Link href="/c/new" className="mb-4 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">+ New chat</Link>
        <nav className="space-y-1 text-sm text-muted-foreground" aria-label="Main navigation">
          <Link className="block rounded-lg px-2 py-2 hover:bg-sidebar-accent" href="/">Workspace</Link>
          <Link className="block rounded-lg px-2 py-2 hover:bg-sidebar-accent" href="/projects">Projects</Link>
          <Link className="block rounded-lg px-2 py-2 hover:bg-sidebar-accent" href="/memory">Memory</Link>
          <Link className="block rounded-lg px-2 py-2 hover:bg-sidebar-accent" href="/artifacts">Artifacts</Link>
          <Link className="block rounded-lg px-2 py-2 hover:bg-sidebar-accent" href="/settings">Settings</Link>
        </nav>
        <p className="mt-6 px-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Recents</p>
        <ConversationList />
        <div className="mt-auto truncate border-t pt-4 text-xs text-muted-foreground">{user?.email ?? 'Signed in'}</div>
      </aside>
      <main className="min-w-0 flex-1"><MobileNav />{children}</main>
    </div>
  );
}
