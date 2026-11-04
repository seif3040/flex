import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { proxy } from '@/proxy';
import * as proxySupabase from '@/lib/supabase/proxy';

vi.mock('@/lib/supabase/proxy', () => ({
  updateSession: vi.fn(),
}));

describe('Next.js 16 Proxy Auth Guard (proxy.ts)', () => {
  const mockUser: User = {
    id: 'user-789',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-11-04T00:00:00Z',
    email: 'user@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated access', () => {
    beforeEach(() => {
      vi.mocked(proxySupabase.updateSession).mockResolvedValue({
        response: NextResponse.next(),
        user: null,
      });
    });

    it('allows access to public pages and endpoints (/login, /signup, /auth/callback, /api/auth/logout)', async () => {
      for (const path of ['/login', '/signup', '/auth/callback', '/api/auth/logout']) {
        const req = new NextRequest(`http://localhost:3000${path}`);
        const res = await proxy(req);
        // NextResponse.next() returns a response without 307 redirect
        expect(res.status).not.toBe(307);
        expect(res.status).not.toBe(401);
      }
    });

    it('returns 401 JSON for unauthenticated API requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat');
      const res = await proxy(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in.',
        },
      });
    });

    it('redirects to /login for protected page requests with next parameter preserved', async () => {
      const req = new NextRequest('http://localhost:3000/c/project-1?view=full');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('next')).toBe('/c/project-1?view=full');
    });

    it('redirects root / to /login without redundant next parameter', async () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.has('next')).toBe(false);
    });
  });

  describe('Authenticated access', () => {
    beforeEach(() => {
      vi.mocked(proxySupabase.updateSession).mockResolvedValue({
        response: NextResponse.next(),
        user: mockUser,
      });
    });

    it('allows access to protected pages and APIs', async () => {
      const req = new NextRequest('http://localhost:3000/c/chat-123');
      const res = await proxy(req);
      expect(res.status).not.toBe(307);
      expect(res.status).not.toBe(401);
    });

    it('redirects authenticated user away from /login to root', async () => {
      const req = new NextRequest('http://localhost:3000/login');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/');
    });

    it('redirects authenticated user to intended next destination when visiting /login', async () => {
      const req = new NextRequest('http://localhost:3000/login?next=/settings');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/settings');
    });

    it('sanitizes open-redirect attempt when authenticated user visits /signup?next=//evil.com', async () => {
      const req = new NextRequest('http://localhost:3000/signup?next=//evil.com/phish');
      const res = await proxy(req);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/');
    });
  });
});
