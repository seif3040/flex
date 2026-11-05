import { z } from 'zod';
export const memorySchema = z.object({ content: z.string().trim().min(1).max(2000) });
export const memoryUpdateSchema = memorySchema.partial().extend({ isActive: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
