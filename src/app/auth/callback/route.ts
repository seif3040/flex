import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectUrl } from '@/lib/auth/redirect';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors emitted directly by Supabase Auth (e.g. expired link)
  if (error) {
    const loginErrorUrl = new URL('/login', request.url);
    loginErrorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginErrorUrl);
  }

  // Handle PKCE code exchange
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginErrorUrl = new URL('/login', request.url);
      loginErrorUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(loginErrorUrl);
    }

    const targetUrl = sanitizeRedirectUrl(next, '/');
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // No code or error provided - redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
