import { z } from 'zod';
export const editMessageSchema = z.object({ content: z.string().trim().min(1).max(100000) });
