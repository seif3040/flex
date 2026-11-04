import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Logout Route Handler (POST /api/auth/logout and GET /api/auth/logout).
 * Signs out the server-side session, clears auth cookies, and redirects to /login.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl, { status: 303 });
}
