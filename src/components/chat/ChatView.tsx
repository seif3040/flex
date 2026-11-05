'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat, type ChatMessage } from '@/hooks/useChat';
import { useModels } from '@/hooks/useModels';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageList } from '@/components/chat/MessageList';
import { ArtifactList } from '@/components/artifact/ArtifactList';
import { WELCOME_DRAFT_KEY } from '@/components/chat/WelcomePrompt';

const FREE_ROUTER = 'openrouter/free';
const MODEL_STORAGE_KEY = 'ai-workspace.default-model';

export function ChatView({ conversationId, title, initialModel, initialProjectId, initialMessages }: { conversationId: string; title: string; initialModel: string; initialProjectId?: string | null; initialMessages: ChatMessage[] }) {
  const [activeId, setActiveId] = useState(conversationId);
  const [welcomeDraft, setWelcomeDraft] = useState('');
  const router = useRouter();
  const [model, setModel] = useState(initialModel === FREE_ROUTER || initialModel.endsWith(':free') ? initialModel : FREE_ROUTER);
  const [modelReady, setModelReady] = useState(Boolean(conversationId));
  const [creationFailed, setCreationFailed] = useState(false);
  const [creationAttempt, setCreationAttempt] = useState(0);
  const [projectId, setProjectId] = useState(initialProjectId ?? '');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const { models, loading, error: modelError } = useModels();
  const chat = useChat(activeId, model, initialMessages);

  useEffect(() => {
    if (!conversationId) return;
    const timer = window.setTimeout(() => {
      try {
        setWelcomeDraft(sessionStorage.getItem(`${WELCOME_DRAFT_KEY}:${conversationId}`) ?? '');
      } catch {
        // Chat remains usable when browser storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [conversationId]);

  useEffect(() => {
    fetch('/api/projects').then((response) => response.json()).then((body) => setProjects(body.data?.projects ?? [])).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (conversationId) return;
    const timer = window.setTimeout(() => {
      const storedModel = window.localStorage.getItem('ai-workspace.default-model');
      if (storedModel === FREE_ROUTER || storedModel?.endsWith(':free')) setModel(storedModel);
      setModelReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [conversationId]);

  useEffect(() => {
    if (!modelReady || activeId) return;
    const abort = new AbortController();
    fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: model, projectId: initialProjectId }), signal: abort.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok || !body.data?.id) throw new Error('Unable to create conversation');
      try {
        const draft = sessionStorage.getItem(WELCOME_DRAFT_KEY);
        if (draft) {
          sessionStorage.setItem(`${WELCOME_DRAFT_KEY}:${body.data.id}`, draft);
          sessionStorage.removeItem(WELCOME_DRAFT_KEY);
        }
      } catch {
        // Creating a chat does not require browser storage.
      }
      setActiveId(body.data.id);
      router.replace(`/c/${body.data.id}`);
    }).catch(() => { if (!abort.signal.aborted) setCreationFailed(true); });
    return () => abort.abort();
  }, [activeId, creationAttempt, initialProjectId, model, modelReady, router]);

  const selectProject = (value: string) => {
    setProjectId(value);
    if (activeId) void fetch(`/api/conversations/${activeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: value || null }) });
  };

  const selectModel = (value: string) => {
    setModel(value);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, value);
    } catch {
      // The conversation still works when browser storage is unavailable.
    }
    if (activeId) {
      void fetch(`/api/conversations/${activeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId: value }) });
    }
  };

  return <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col md:h-dvh">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-8">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Workspace / Chat</p>
        <h1 dir="auto" className="break-words text-start text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:max-w-[60%]">
        <select aria-label="Project" value={projectId} onChange={(event) => selectProject(event.target.value)} disabled={!activeId || chat.isStreaming} className="h-9 min-w-0 max-w-[42%] truncate rounded-md border bg-background px-2 text-xs sm:max-w-48 sm:text-sm"><option value="">No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      </div>
    </header>
    {(chat.error || modelError) && <div role="alert" className="border-b bg-destructive/10 px-3 py-3 text-sm text-destructive sm:px-6">{chat.error ?? modelError}</div>}
    {creationFailed && (
      <div role="alert" className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3 text-sm">
        <span>Could not start a new chat.</span>
        <button type="button" className="rounded-lg border px-3 py-1.5 hover:bg-muted" onClick={() => {
          setCreationFailed(false);
          setCreationAttempt((attempt) => attempt + 1);
        }}>Try again</button>
      </div>
    )}
    <ArtifactList conversationId={activeId} />
    <MessageList messages={chat.messages} isStreaming={chat.isStreaming} onEdit={chat.editMessage} onRegenerate={chat.regenerate} />
    <ChatComposer key={welcomeDraft} initialContent={welcomeDraft} conversationId={activeId} models={models} model={model} onModelChange={selectModel} modelsLoading={loading} onSend={(content, useWebSearch, useMemory, attachmentIds) => {
      if (welcomeDraft) {
        try {
          sessionStorage.removeItem(`${WELCOME_DRAFT_KEY}:${activeId}`);
        } catch {
          // Sending a message does not require browser storage.
        }
      }
      chat.sendMessage(content, { useWebSearch, useMemory, attachmentIds });
    }} onStop={chat.stopStreaming} isStreaming={chat.isStreaming || !activeId} />
  </div>;
}
