import { z } from 'zod';
import type { NormalizedModel } from './types';

const modelSchema = z.object({ id: z.string(), name: z.string().optional(), description: z.string().optional(), context_length: z.number().optional(), pricing: z.object({ prompt: z.string(), completion: z.string() }).passthrough(), architecture: z.object({ input_modalities: z.array(z.string()).optional() }).passthrough().optional(), supported_parameters: z.array(z.string()).optional() }).passthrough();

export async function fetchModels(apiKey: string): Promise<NormalizedModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`OpenRouter models request failed (${response.status})`);
  const payload = z.object({ data: z.array(modelSchema) }).parse(await response.json());
  return payload.data.map((model) => ({ id: model.id, name: model.name ?? model.id, contextWindow: model.context_length ?? 0, pricing: model.pricing, isFree: model.pricing.prompt === '0' && model.pricing.completion === '0', supportsVision: model.architecture?.input_modalities?.includes('image') ?? false, supportsTools: model.supported_parameters?.includes('tools') ?? false, description: model.description ?? '' }));
}
