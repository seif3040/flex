'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ArtifactPanel({ id, title, initialContent, language, onClose, embedded = false }: { id: string; title: string; initialContent: string; language: string; onClose: () => void; embedded?: boolean }) {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      const response = await fetch(`/api/artifacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, title }) });
      setStatus(response.ok ? 'Version saved.' : 'Could not save this version.');
    } catch {
      setStatus('Could not save this version.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <aside aria-label="Artifact workspace" className={embedded
      ? 'flex h-[min(70dvh,42rem)] min-h-80 min-w-0 flex-col overflow-hidden rounded-2xl border bg-card'
      : 'fixed inset-y-0 end-0 z-40 flex w-full max-w-2xl flex-col border-s bg-card shadow-xl'}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Workspace / Artifact</p>
          <h2 className="break-words text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{language}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save version'}</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </header>
      {language.toLowerCase() === 'html' && <div className="flex gap-2 border-b p-3">
        <Button variant={preview ? 'ghost' : 'secondary'} aria-pressed={!preview} onClick={() => setPreview(false)}>Code</Button>
        <Button variant={preview ? 'secondary' : 'ghost'} aria-pressed={preview} onClick={() => setPreview(true)}>Preview</Button>
      </div>}
      {preview
        ? <iframe title="Artifact preview" sandbox="" referrerPolicy="no-referrer" srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">${content}`} className="min-h-0 w-full flex-1 bg-white" />
        : <textarea aria-label="Artifact code" dir="ltr" wrap="off" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-0 w-full min-w-0 flex-1 resize-none bg-background p-4 font-mono text-sm outline-none" spellCheck={false} />}
      <p role="status" className="border-t px-4 py-2 text-sm text-muted-foreground">{status}</p>
    </aside>
  );
}
