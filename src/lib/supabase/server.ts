import { createServerClient } from '@supabase/ssr';
import { createClient as createBaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getServerSupabaseEnv } from '@/lib/env';

/**
 * Creates a server-side Supabase client for Route Handlers, Server Actions,
 * and Server Components. Reads and writes cookies using Next.js 16 async cookieStore.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getServerSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if the session is refreshed via Next.js proxy/middleware.
        }
      },
    },
  });
}

/**
 * Creates an admin Supabase client using the service-role key.
 * ⚠️ NEVER call or expose this on client-side code. Used exclusively for
 * privileged system tasks (e.g. system setup, administrative triggers).
 */
export function createAdminClient(): SupabaseClient<Database> {
  const { url, serviceRoleKey } = getServerSupabaseEnv();

  if (!serviceRoleKey) {
    throw new Error(
      '[Security / Configuration Error] SUPABASE_SERVICE_ROLE_KEY is required for admin client initialization.'
    );
  }

  return createBaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
