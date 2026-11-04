import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/auth/callback/route';
import * as serverSupabase from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Auth Callback Route Handler (GET /auth/callback)', () => {
  const exchangeCodeForSessionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serverSupabase.createClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it('redirects to /login with error if auth error params are passed by provider', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied&error_description=User+cancelled'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('User cancelled');
  });

  it('exchanges code for session and redirects to sanitized next destination', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-auth-code&next=/settings'
    );

    const response = await GET(request);
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('valid-auth-code');
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/settings');
  });

  it('sanitizes malicious open-redirect next parameter to root /', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-auth-code&next=//attacker.com/steal'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/');
  });

  it('redirects to /login with error if exchangeCodeForSession fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: { message: 'Auth code has expired' },
    });

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=expired-auth-code'
    );

    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('Auth code has expired');
  });

  it('redirects to /login if neither code nor error is present', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback');

    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });
});
