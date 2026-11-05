import { WorkspaceManager } from '@/components/settings/WorkspaceManager';

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-12">
      <p className="text-xs text-muted-foreground">Workspace / Projects</p>
      <h1 className="mb-6 mt-8 text-3xl font-semibold tracking-tight">Projects</h1>
      <WorkspaceManager section="projects" />
    </section>
  );
}
