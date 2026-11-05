import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/logout/route';
import { signOut } from '@/lib/auth/logout';
import * as serverSupabase from '@/lib/supabase/server';
import * as clientSupabase from '@/lib/supabase/client';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('Logout Functionality (Route & Client)', () => {
  const serverSignOutMock = vi.fn();
  const clientSignOutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(serverSupabase.createClient).mockResolvedValue({
      auth: {
        signOut: serverSignOutMock,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

    vi.mocked(clientSupabase.createClient).mockReturnValue({
      auth: {
        signOut: clientSignOutMock,
      },
    } as unknown as ReturnType<typeof clientSupabase.createClient>);
  });

  describe('POST /api/auth/logout', () => {
    it('signs out user and redirects to /login with 303 See Other', async () => {
      serverSignOutMock.mockResolvedValue({ error: null });

      const req = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const res = await POST(req);
      expect(serverSignOutMock).toHaveBeenCalled();
      expect(res.status).toBe(303);

      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/login');
    });
  });

  describe('GET /api/auth/logout', () => {
    it('rejects GET with 405 Method Not Allowed to prevent CSRF logout attacks', async () => {
      const res = await GET();
      expect(serverSignOutMock).not.toHaveBeenCalled();
      expect(res.status).toBe(405);
      expect(res.headers.get('Allow')).toBe('POST');
      const json = await res.json();
      expect(json.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('Client signOut helper', () => {
    it('calls client supabase.auth.signOut() and assigns window.location', async () => {
      clientSignOutMock.mockResolvedValue({ error: null });

      const originalLocation = window.location;
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: mockLocation,
        writable: true,
      });

      try {
        await signOut('/login');
        expect(clientSignOutMock).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          enumerable: true,
          value: originalLocation,
          writable: true,
        });
      }
    });
  });
});
