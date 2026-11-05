import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { WorkspaceManager } from '@/components/settings/WorkspaceManager';

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-12">
      <p className="text-xs text-muted-foreground">Workspace / Settings</p>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage your workspace preferences and provider connections.</p>
      <nav aria-label="Settings sections" className="mt-6 flex flex-wrap gap-2 text-sm">
        <a className="rounded-full border bg-card px-3 py-1.5 hover:bg-muted" href="#appearance">Appearance</a>
        <a className="rounded-full border bg-card px-3 py-1.5 hover:bg-muted" href="#models">Models & API key</a>
        <a className="rounded-full border bg-card px-3 py-1.5 hover:bg-muted" href="#workspace-data">Projects & memory</a>
      </nav>
      <div className="mt-8 space-y-5">
        <section id="appearance" className="flex scroll-mt-20 items-center justify-between gap-4 rounded-2xl border bg-card p-5">
          <div>
            <h2 className="font-medium">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Switch between light, dark, and system themes.</p>
          </div>
          <ThemeToggle />
        </section>
        <section id="models" className="scroll-mt-20 rounded-2xl border bg-card p-5">
          <h2 className="font-medium">Models & API key</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">Connect OpenRouter and choose your default model.</p>
          <ApiKeyManager />
        </section>
        <section id="workspace-data" className="scroll-mt-20 rounded-2xl bg-card">
          <WorkspaceManager />
        </section>
      </div>
    </section>
  );
}
