'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const MODEL_STORAGE_KEY = 'ai-workspace.default-model';
const FALLBACK_MODEL = 'openrouter/free';

export function ApiKeyManager() {
  const [hint, setHint] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [modelId, setModelId] = useState(FALLBACK_MODEL);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
      if (storedModel === FALLBACK_MODEL || storedModel?.endsWith(':free')) setModelId(storedModel);
      void fetch('/api/keys').then(async (response) => {
        if (!response.ok) throw new Error('Unable to load API key status');
        const body = await response.json();
        setHint(body.data?.hint ?? null);
      }).catch(() => setMessage('Unable to load API key status.'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const selectedModel = modelId.trim() || FALLBACK_MODEL;
    if (selectedModel !== FALLBACK_MODEL && !selectedModel.endsWith(':free')) {
      setMessage('Please enter a free model ID ending with :free.');
      setBusy(false);
      return;
    }
    window.localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
    if (!key.trim()) {
      setMessage('Model saved. Enter an API key to save the provider connection.');
      setBusy(false);
      return;
    }
    try {
      const response = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key.trim() }) });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error?.message ?? 'Unable to save key'); return; }
      setHint(body.data.hint);
      setKey('');
      setMessage('Saved securely.');
    } catch { setMessage('Unable to reach the server.'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/keys', { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to remove API key');
      setHint(null);
      setMessage('API key removed.');
    } catch {
      setMessage('Unable to remove API key.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{hint ? `Saved key: ${hint}` : 'No API key saved.'}</p>
    <div className="space-y-2">
      <label className="text-sm" htmlFor="openrouter-key">OpenRouter API key</label>
      <div className="flex gap-2"><input id="openrouter-key" className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder={hint ? 'Leave blank to keep current key' : 'sk-or-v1-...'} /><Button onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>{hint && <Button variant="outline" onClick={() => void remove()} disabled={busy}>Delete</Button>}</div>
    </div>
    <div className="space-y-2">
      <label className="text-sm" htmlFor="default-model">Default model ID</label>
      <input id="default-model" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={modelId} onChange={(event) => setModelId(event.target.value)} placeholder={FALLBACK_MODEL} aria-describedby="default-model-help" />
      <p id="default-model-help" className="text-xs text-muted-foreground">Use openrouter/free or a free model ID ending in :free. This preference is saved in this browser for new conversations.</p>
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </div>;
}
