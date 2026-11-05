'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function FileUploader({ conversationId, onUploaded, className }: { conversationId: string; onUploaded?: (file: { id: string; original_name: string }) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const upload = async (file: File) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const prepare = await fetch('/api/files/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, type: file.type, size: file.size, conversationId }) });
      const prepared = await prepare.json().catch(() => null);
      if (!prepare.ok || !prepared?.data?.path || !prepared.data.token) { setMessage(prepared?.error?.message ?? `Upload failed (${prepare.status})`); return; }
      const direct = await createClient().storage.from('user-uploads').uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType: file.type });
      if (direct.error) { setMessage(`Upload failed: ${direct.error.message}`); return; }
      const complete = await fetch('/api/files/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: prepared.data.path, name: file.name, type: file.type, size: file.size, conversationId }) });
      const body = await complete.json().catch(() => null);
      if (!complete.ok) { setMessage(body?.error?.message ?? `Upload failed (${complete.status})`); return; }
      if (!body?.data?.id || !body.data.original_name) { setMessage('Upload returned an invalid response'); return; }
      onUploaded?.(body.data);
    } catch { setMessage('Unable to reach the server.'); } finally { setBusy(false); }
  };
  return <div className="flex min-w-0 flex-wrap items-center gap-2"><input ref={input} type="file" className="hidden" accept="application/pdf,text/plain,text/markdown,image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} /><Button type="button" variant="outline" className={className} onClick={() => input.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Attach'}</Button>{message && <span role="status" dir="auto" className="min-w-0 max-w-full break-words text-xs text-destructive">{message}</span>}</div>;
}
