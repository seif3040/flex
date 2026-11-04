import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getServerSupabaseEnv } from '@/lib/env';

export interface UpdateSessionResult {
  response: NextResponse;
  user: User | null;
}

/**
 * Handles cookie session refresh and user authentication inspection for Next.js 16 proxy.
 * Must be called in proxy.ts before serving protected route requests.
 */
export async function updateSession(
  request: NextRequest
): Promise<UpdateSessionResult> {
  const { url, anonKey } = getServerSupabaseEnv();

  // Create an initial response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() here.
  // getUser() validates the token with the Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    response: supabaseResponse,
    user,
  };
}
