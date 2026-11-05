import { z } from 'zod';

export const chatSchema = z.object({ conversationId: z.string().uuid(), content: z.string().trim().min(1).max(100000), modelId: z.string().min(1).max(200), parentId: z.string().uuid().optional(), regenerate: z.boolean().optional().default(false), attachmentIds: z.array(z.string().uuid()).max(10).optional(), useMemory: z.boolean().optional().default(false), useWebSearch: z.boolean().optional().default(false) });
