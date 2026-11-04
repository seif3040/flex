import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { sanitizeRedirectUrl } from '@/lib/auth/redirect';

// Routes that can be accessed without an authenticated session
const PUBLIC_PATHS = ['/login', '/signup', '/auth/callback', '/api/auth/logout'];

/**
 * Next.js 16 Proxy entry point.
 * Runs on every request defined by config.matcher before route rendering.
 *
 * 1. Refreshes the Supabase auth session cookies.
 * 2. Enforces authentication boundaries on protected pages and APIs.
 * 3. Prevents open redirects and redirect loops.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh Supabase session and retrieve verified user
  const { response, user } = await updateSession(request);

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 2. If user is authenticated and visits /login or /signup, redirect to target or home
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const nextParam = request.nextUrl.searchParams.get('next');
    const destination = sanitizeRedirectUrl(nextParam, '/');
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 3. Allow public routes through
  if (isPublicPath) {
    return response;
  }

  // 4. Protect private routes
  if (!user) {
    // API routes return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please sign in.',
          },
        },
        { status: 401 }
      );
    }

    // Page routes redirect to /login with safely encoded destination
    const loginUrl = new URL('/login', request.url);
    const intendedDestination = pathname + request.nextUrl.search;

    if (intendedDestination !== '/' && !intendedDestination.startsWith('/login')) {
      loginUrl.searchParams.set('next', intendedDestination);
    }

    return NextResponse.redirect(loginUrl);
  }

  // 5. User is authenticated on a protected route - proceed with refreshed session
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static asset images (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
