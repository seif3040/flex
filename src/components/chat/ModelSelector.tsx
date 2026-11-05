'use client';

import type { NormalizedModel } from '@/lib/openrouter/types';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ModelSelector({ models, value, onChange, disabled, className }: { models: NormalizedModel[]; value: string; onChange: (value: string) => void; disabled?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const choices = models.filter((model) => model.isFree && model.id !== 'openrouter/free');
  const auto = { id: 'openrouter/free', name: 'Auto · Free' };
  const selected = value === auto.id ? auto.name : (choices.find((model) => model.id === value)?.name ?? value);
  const results = [auto, ...choices].filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(search));
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <DialogTrigger disabled={disabled} className={`min-w-0 truncate rounded-xl border bg-background px-2.5 py-1.5 text-start text-xs transition-colors hover:bg-muted ${className ?? ''}`} aria-label={`Model: ${selected}`}>
        {selected}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Choose a model</DialogTitle>
        <DialogDescription>Free models available through OpenRouter.</DialogDescription>
        <input type="search" aria-label="Search models" placeholder="Search models" className="w-full rounded-lg border bg-background px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} />
        <ul className="max-h-[45dvh] space-y-1 overflow-y-auto">
          {results.map((model) => (
            <li key={model.id}>
              <button type="button" aria-pressed={value === model.id} className="w-full rounded-lg px-3 py-2 text-start hover:bg-muted aria-pressed:bg-primary/10" onClick={() => { onChange(model.id); setOpen(false); setQuery(''); }}>
                <span className="block font-medium">{model.name}</span>
                <span className="block break-all text-xs text-muted-foreground">{model.id}</span>
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p role="status" className="text-muted-foreground">No free models match your search.</p>}
      </DialogContent>
    </Dialog>
  );
}
