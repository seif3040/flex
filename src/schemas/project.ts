import { z } from 'zod';
export const projectSchema = z.object({ name: z.string().trim().min(1).max(255), description: z.string().max(10000).optional(), systemPrompt: z.string().max(10000).optional() });
export const projectUpdateSchema = projectSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
