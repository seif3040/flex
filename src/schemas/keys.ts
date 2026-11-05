import { z } from 'zod';

export const apiKeySchema = z.object({ key: z.string().min(20).startsWith('sk-or') });
