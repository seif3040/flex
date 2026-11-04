import { createClient } from '@/lib/supabase/client';

/**
 * Signs the user out of the current session on the client,
 * clears local cookie/auth state, and redirects to /login.
 */
export async function signOut(redirectTo = '/login'): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } finally {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }
}
