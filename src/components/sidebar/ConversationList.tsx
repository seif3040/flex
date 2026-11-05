'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
type Conversation = { id: string; title: string; updatedAt: string };
export function ConversationList({ onNavigate }: { onNavigate?: () => void }) { const [items, setItems] = useState<Conversation[]>([]); const [query, setQuery] = useState(''); useEffect(() => { fetch(`/api/conversations${query ? `?q=${encodeURIComponent(query)}` : ''}`).then((response) => response.json()).then((body) => setItems(body.data?.conversations ?? [])).catch(() => setItems([])); }, [query]); return <div className="mt-6 min-h-0 flex-1 space-y-2"><input className="h-8 w-full rounded-md border bg-background px-2 text-xs" placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search conversations" /><div className="max-h-full space-y-1 overflow-y-auto">{items.map((item) => <Link key={item.id} onClick={onNavigate} href={`/c/${item.id}`} className="block truncate rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent">{item.title}</Link>)}{items.length === 0 && <p className="px-2 text-xs text-muted-foreground">No conversations yet.</p>}</div></div>; }
