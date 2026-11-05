'use client';

import { useCallback, useRef, useState } from 'react';

export type ChatMessage = { id: string; role: 'user' | 'assistant' | 'system'; content: string };

export function useChat(conversationId: string, modelId: string, initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, options?: { useWebSearch?: boolean; useMemory?: boolean; parentId?: string; regenerate?: boolean; attachmentIds?: string[] }) => {
    if (!content.trim() || isStreaming) return;
    setError(null);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages((current) => options?.regenerate ? [...current, assistantMessage] : [...current, userMessage, assistantMessage]);
    setIsStreaming(true);
    controller.current = new AbortController();
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, modelId, content, parentId: options?.parentId, regenerate: options?.regenerate ?? false, attachmentIds: options?.attachmentIds, useWebSearch: options?.useWebSearch ?? false, useMemory: options?.useMemory ?? false }), signal: controller.current.signal });
      if (!response.ok || !response.body) throw new Error((await response.json().catch(() => null))?.error?.message ?? 'Unable to start chat');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim(); if (payload === '[DONE]') continue;
          let event: { type?: string; content?: string; message?: string; messageId?: string };
          try { event = JSON.parse(payload) as { type?: string; content?: string; message?: string; messageId?: string }; } catch { continue; }
          if (event.type === 'start' && event.messageId && !options?.regenerate) setMessages((current) => current.map((message) => message.id === userMessage.id ? { ...message, id: event.messageId! } : message));
          if (event.type === 'chunk' && event.content) setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: message.content + event.content } : message));
          if (event.type === 'error') throw new Error(event.message ?? 'Provider error');
        }
      }
      buffer += decoder.decode();
      const finalPayload = buffer.split('\n').find((line) => line.startsWith('data: '))?.slice(6).trim();
      if (finalPayload && finalPayload !== '[DONE]') {
        try {
          const event = JSON.parse(finalPayload) as { type?: string; content?: string };
          if (event.type === 'chunk' && event.content) setMessages((current) => current.map((message) => message.id === assistantMessage.id ? { ...message, content: message.content + event.content } : message));
        } catch { /* ignore an incomplete provider event */ }
      }
    } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught instanceof Error ? caught.message : 'Chat failed'); }
    finally { controller.current = null; setIsStreaming(false); }
  }, [conversationId, isStreaming, modelId]);

  const stopStreaming = useCallback(() => controller.current?.abort(), []);
  const editMessage = useCallback(async (messageId: string, content: string) => {
    const response = await fetch(`/api/messages/${messageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error?.message ?? 'Unable to edit message');
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, content } : message));
  }, []);
  const regenerate = useCallback(async (assistantMessageId: string) => { const index = messages.findIndex((message) => message.id === assistantMessageId); const previous = index > 0 ? messages[index - 1] : undefined; if (!previous || previous.role !== 'user') return; setMessages((current) => current.filter((message) => message.id !== assistantMessageId)); await sendMessage(previous.content, { parentId: previous.id, regenerate: true }); }, [messages, sendMessage]);
  return { messages, isStreaming, error, sendMessage, stopStreaming, editMessage, regenerate };
}
