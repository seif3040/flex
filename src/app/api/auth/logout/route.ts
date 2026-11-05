import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Logout Route Handler (POST /api/auth/logout).
 * Signs out the server-side session, clears auth cookies, and redirects to /login.
 * GET is explicitly rejected (405) to prevent CSRF and prefetch-triggered state changes.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export function GET() {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Logout must be initiated via POST request to prevent CSRF.',
      },
    },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
