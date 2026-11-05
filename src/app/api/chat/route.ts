import { NextResponse } from 'next/server';
import { chatSchema } from '@/schemas/chat';
import { decryptKey } from '@/lib/crypto/keys';
import { streamCompletion, ProviderError } from '@/lib/openrouter/gateway';
import { createClient } from '@/lib/supabase/server';
import { createUnauthorizedResponse, requireServerUser } from '@/lib/auth/session';
import { detectArtifacts } from '@/lib/artifacts/detect';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createConversationTitle } from '@/lib/chat/title';

export async function POST(request: Request) {
  let user; try { user = await requireServerUser(); } catch { return createUnauthorizedResponse(); }
  const rate = checkRateLimit(`chat:${user.id}`, 60, 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many chat requests' } }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const parsed = chatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid chat request', details: parsed.error.flatten() } }, { status: 400 });
  const { conversationId, content, modelId, parentId, regenerate, attachmentIds, useWebSearch, useMemory } = parsed.data;
  if (useWebSearch) {
    return Response.json({ error: { code: 'WEB_SEARCH_UNAVAILABLE', message: 'Web search is unavailable in free-only mode.' } }, { status: 422 });
  }
  if (modelId !== 'openrouter/free' && !modelId.endsWith(':free')) return NextResponse.json({ error: { code: 'PAID_MODEL_BLOCKED', message: 'Only free models are allowed in this workspace' } }, { status: 403 });
  const supabase = await createClient();
  const { data: conversation } = await supabase.from('conversations').select('*').eq('id', conversationId).eq('user_id', user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Conversation not found or not owned by user' } }, { status: 403 });
  const { data: key } = await supabase.from('api_keys').select('encrypted_key').eq('user_id', user.id).maybeSingle();
  if (!key) return NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Save an OpenRouter API key first' } }, { status: 503 });
  const { data: history } = await supabase.from('messages').select('id,role,content,parent_id,created_at').eq('conversation_id', conversationId).order('created_at');
  const { data: attachments, error: attachmentsError } = attachmentIds?.length ? await supabase.from('files').select('id,original_name,mime_type,extracted_text').in('id', attachmentIds).eq('user_id', user.id).or(`conversation_id.eq.${conversationId},conversation_id.is.null`) : { data: [], error: null };
  if (attachmentsError) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to read attachments' } }, { status: 500 });
  if (attachmentIds?.length && (attachments?.length ?? 0) !== new Set(attachmentIds).size) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'One or more attachments are not available' } }, { status: 403 });
  const branchParent = regenerate && parentId ? history?.find((message) => message.id === parentId && message.role === 'user') : undefined;
  if (regenerate && !branchParent) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Regeneration target not found' } }, { status: 400 });
  if (!regenerate && parentId && !(history ?? []).some((message) => message.id === parentId)) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Branch parent not found in conversation' } }, { status: 400 });
  const contextMessages: Array<{ role: string; content: string }> = [];
  if (conversation.system_prompt) contextMessages.push({ role: 'system', content: conversation.system_prompt });
  if (conversation.project_id) { const { data: project } = await supabase.from('projects').select('system_prompt').eq('id', conversation.project_id).eq('user_id', user.id).maybeSingle(); if (project?.system_prompt) contextMessages.push({ role: 'system', content: project.system_prompt }); }
  if (useMemory) { const { data: memories } = await supabase.from('memory_entries').select('content').eq('user_id', user.id).eq('is_active', true); if (memories?.length) contextMessages.push({ role: 'system', content: `User memory:\n${memories.map((entry) => `- ${entry.content}`).join('\n')}` }); }
  const attachmentContext = (attachments ?? []).reduce((result, attachment) => {
    if (!attachment.extracted_text || result.length >= 120_000) return result;
    const remaining = 120_000 - result.length;
    return `${result}\n\n--- ${attachment.original_name} (${attachment.mime_type}) ---\n${attachment.extracted_text.slice(0, remaining)}`;
  }, '');
  const promptContent = attachmentContext ? `${content}\n\nReference content from attached files:\n${attachmentContext}` : content;
  const userMessage = branchParent ? { data: { id: branchParent.id }, error: null } : await supabase.from('messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content, model_id: modelId, parent_id: parentId }).select('id').single();
  if (userMessage.error || !userMessage.data) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to save message' } }, { status: 500 });
  if (!regenerate && conversation.title === 'New Conversation') {
    await supabase.from('conversations').update({ title: createConversationTitle(content) }).eq('id', conversationId).eq('user_id', user.id).eq('title', 'New Conversation');
  }
  if (attachments?.length) await supabase.from('files').update({ message_id: userMessage.data.id }).in('id', attachments.map((file) => file.id)).eq('user_id', user.id);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistant = '';
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        const priorHistory = branchParent ? (history ?? []).filter((message) => message.created_at <= branchParent.created_at && message.id !== branchParent.id) : (history ?? []);
        const upstream = await streamCompletion(decryptKey(key.encrypted_key), modelId, [...contextMessages, ...priorHistory.map(({ role, content: messageContent }) => ({ role, content: messageContent })), { role: 'user', content: promptContent }]);
        const reader = upstream.getReader(); const decoder = new TextDecoder(); let buffer = '';
        send({ type: 'start', messageId: userMessage.data.id, model: modelId });
        while (true) {
          const part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true });
          const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue; const raw = line.slice(6).trim(); if (raw === '[DONE]') continue;
            try { const delta = JSON.parse(raw).choices?.[0]?.delta?.content; if (typeof delta === 'string') { assistant += delta; send({ type: 'chunk', content: delta }); } } catch { /* keep-alive or tool event */ }
          }
        }
        const assistantMessage = await supabase.from('messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: assistant, model_id: modelId, parent_id: userMessage.data.id }).select('id').single();
        if (assistantMessage.data) { for (const artifact of detectArtifacts(assistant)) await supabase.from('artifacts').insert({ user_id: user.id, conversation_id: conversationId, message_id: assistantMessage.data.id, title: artifact.title, language: artifact.language, content: artifact.content }); }
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).eq('user_id', user.id);
        send({ type: 'done', finishReason: 'stop' }); send('[DONE]');
      } catch (error) {
        send({ type: 'error', code: 'PROVIDER_ERROR', message: error instanceof ProviderError ? 'OpenRouter provider error' : 'Unable to complete chat' }); send('[DONE]');
      } finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}
