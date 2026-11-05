import { ArtifactList } from '@/components/artifact/ArtifactList';

export default function ArtifactsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-12">
      <p className="text-xs text-muted-foreground">Workspace / Artifacts</p>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Artifact workspace</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">Open and preview code saved from your conversations.</p>
      <ArtifactList />
    </section>
  );
}
