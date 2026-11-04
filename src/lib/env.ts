import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty' }),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY cannot be empty' })
    .optional(),
  KEY_ENCRYPTION_SECRET: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, {
      message: 'KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)',
    })
    .optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Checks whether the minimum required public Supabase environment variables are provided.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  return Boolean(url && key && url.startsWith('http'));
}

/**
 * Returns validated public environment variables for Supabase.
 * Throws a helpful, descriptive error if missing or invalid.
 */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `• ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    throw new Error(
      `[Supabase Configuration Error] Missing or invalid environment variables:\n${errorDetails}\n\nPlease check your .env.local file or refer to .env.local.example.`
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Returns validated server-side environment variables.
 * Enforces that this is NEVER invoked in the browser bundle.
 */
export function getServerSupabaseEnv(): {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
} {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Security Violation] Attempted to access server environment variables from the browser.'
    );
  }

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'],
    KEY_ENCRYPTION_SECRET: process.env['KEY_ENCRYPTION_SECRET'],
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `• ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    throw new Error(
      `[Supabase Configuration Error] Missing or invalid server environment variables:\n${errorDetails}\n\nPlease check your .env.local file or refer to .env.local.example.`
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}
