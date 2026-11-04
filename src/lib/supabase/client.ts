import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getPublicSupabaseEnv } from '@/lib/env';

let clientSingleton: SupabaseClient<Database> | null = null;

/**
 * Creates or retrieves a singleton Supabase client for browser usage.
 * Persists session via cookies and handles auth state changes client-side.
 */
export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = getPublicSupabaseEnv();

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(url, anonKey);
  }

  if (!clientSingleton) {
    clientSingleton = createBrowserClient<Database>(url, anonKey);
  }

  return clientSingleton;
}
