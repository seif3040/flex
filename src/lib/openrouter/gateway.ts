export class ProviderError extends Error { constructor(public readonly status: number, message: string) { super(message); this.name = 'ProviderError'; } }

export async function streamCompletion(apiKey: string, model: string, messages: Array<{ role: string; content: string }>): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000', 'X-Title': 'flex' }, body: JSON.stringify({ model, messages, stream: true }) });
  if (!response.ok || !response.body) throw new ProviderError(response.status, `OpenRouter request failed (${response.status})`);
  return response.body;
}
