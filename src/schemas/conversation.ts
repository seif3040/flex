import { z } from 'zod';

export const createConversationSchema = z.object({ title: z.string().max(255).optional(), modelId: z.string().min(1).max(200), projectId: z.string().uuid().nullable().optional(), systemPrompt: z.string().max(10000).optional() });
export const updateConversationSchema = createConversationSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
