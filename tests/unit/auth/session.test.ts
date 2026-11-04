import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getServerUser,
  getServerSession,
  requireServerUser,
  createUnauthorizedResponse,
  UnauthorizedError,
} from '@/lib/auth/session';
import * as serverSupabase from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Server Authentication Helpers (session.ts)', () => {
  const mockUser = {
    id: 'user-12345',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: '2026-11-04T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServerUser', () => {
    it('returns the authenticated user when session is valid', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const user = await getServerUser();
      expect(user).toEqual(mockUser);
    });

    it('returns null when Supabase returns an auth error', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid JWT token'),
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const user = await getServerUser();
      expect(user).toBeNull();
    });

    it('returns null when createClient throws an exception', async () => {
      vi.mocked(serverSupabase.createClient).mockRejectedValue(
        new Error('Cookies not accessible')
      );

      const user = await getServerUser();
      expect(user).toBeNull();
    });
  });

  describe('getServerSession (P03-T03 Contract)', () => {
    it('delegates to getServerUser and returns user when authenticated', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const session = await getServerSession();
      expect(session).toEqual(mockUser);
    });

    it('returns null when unauthenticated', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const session = await getServerSession();
      expect(session).toBeNull();
    });
  });

  describe('requireServerUser', () => {
    it('returns the user when authenticated', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const user = await requireServerUser();
      expect(user).toEqual(mockUser);
    });

    it('throws UnauthorizedError when not authenticated', async () => {
      vi.mocked(serverSupabase.createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      await expect(requireServerUser()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('returns a 401 response with standardized error envelope', async () => {
      const response = createUnauthorizedResponse('Custom unauthorized message');
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Custom unauthorized message',
        },
      });
    });
  });
});
