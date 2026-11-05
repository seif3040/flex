'use client';

import { useEffect, useState } from 'react';
import { ArtifactPanel } from '@/components/artifact/ArtifactPanel';

type Artifact = { id: string; title: string; language: string; content: string; version: number };

export function ArtifactList({ conversationId }: { conversationId?: string }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (conversationId === '') return;
    const endpoint = conversationId
      ? `/api/artifacts?conversationId=${encodeURIComponent(conversationId)}`
      : '/api/artifacts';
    const controller = new AbortController();
    let timer: number | undefined;
    async function load() {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load artifacts');
        const body = await response.json();
        if (controller.signal.aborted) return;
        setArtifacts(body.data?.artifacts ?? []);
        setFailed(false);
        setLoaded(true);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(load, 5000);
      }
    }
    void load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [conversationId]);
  if (!artifacts.length && failed) return <p role="status" className="px-4 py-2 text-sm text-muted-foreground">Could not load artifacts. Retrying…</p>;
  if (!artifacts.length && !selected) {
    return conversationId === undefined
      ? <p role="status" className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">{loaded ? 'No artifacts yet. Code saved from your chats appears here.' : 'Loading artifacts…'}</p>
      : null;
  }
  return <section className={conversationId === undefined ? "grid items-start gap-4 lg:grid-cols-[minmax(13rem,1fr)_minmax(0,3fr)]" : "border-b px-6 py-3"}><div><h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Artifacts</h2><div className="flex flex-wrap gap-2">{artifacts.map((artifact) => <button key={artifact.id} type="button" className="rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => setSelected(artifact)}><span className="block font-medium">{artifact.title}</span><span className="text-xs text-muted-foreground">{artifact.language} · v{artifact.version}</span></button>)}</div></div>{selected && <ArtifactPanel key={selected.id} embedded={conversationId === undefined} id={selected.id} title={selected.title} initialContent={selected.content} language={selected.language} onClose={() => setSelected(null)} />}</section>;
}
