// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSupabaseConfigured,
  getPublicSupabaseEnv,
  getServerSupabaseEnv,
} from '@/lib/env';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';

describe('Supabase Environment & Client Setup (P02-T01)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isSupabaseConfigured', () => {
    it('returns false when environment variables are not set', () => {
      delete process.env['NEXT_PUBLIC_SUPABASE_URL'];
      delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('returns true when valid environment variables are present', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key-12345';
      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe('getPublicSupabaseEnv', () => {
    it('throws a descriptive error when required variables are missing', () => {
      delete process.env['NEXT_PUBLIC_SUPABASE_URL'];
      delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

      expect(() => getPublicSupabaseEnv()).toThrow(
        /Missing or invalid environment variables/
      );
    });

    it('throws when URL is not a valid URL', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'not-a-valid-url';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';

      expect(() => getPublicSupabaseEnv()).toThrow(
        /must be a valid URL/
      );
    });

    it('returns validated url and anonKey when valid', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://myproject.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'valid-anon-key-abc';

      const env = getPublicSupabaseEnv();
      expect(env.url).toBe('https://myproject.supabase.co');
      expect(env.anonKey).toBe('valid-anon-key-abc');
    });
  });

  describe('getServerSupabaseEnv', () => {
    it('returns server environment variables when called on the server', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://myproject.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'valid-anon-key-abc';
      process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'secret-service-role-key';

      const env = getServerSupabaseEnv();
      expect(env.url).toBe('https://myproject.supabase.co');
      expect(env.anonKey).toBe('valid-anon-key-abc');
      expect(env.serviceRoleKey).toBe('secret-service-role-key');
    });

    it('throws a security violation if invoked in a browser window context', () => {
      (global as unknown as { window: unknown }).window = {};
      try {
        expect(() => getServerSupabaseEnv()).toThrow(/Security Violation/);
      } finally {
        // @ts-expect-error cleanup window
        delete global.window;
      }
    });
  });

  describe('createBrowserClient', () => {
    it('initializes Supabase browser client when environment is configured', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://myproject.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'valid-anon-key-abc';

      const client = createBrowserClient();
      expect(client).toBeDefined();
      expect(typeof client.auth.signInWithPassword).toBe('function');
      expect(typeof client.from).toBe('function');
    });
  });

  describe('createAdminClient', () => {
    it('throws when SUPABASE_SERVICE_ROLE_KEY is not defined', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://myproject.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'valid-anon-key-abc';
      delete process.env['SUPABASE_SERVICE_ROLE_KEY'];

      expect(() => createAdminClient()).toThrow(
        /SUPABASE_SERVICE_ROLE_KEY is required/
      );
    });

    it('initializes admin client when service role key is present', () => {
      process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://myproject.supabase.co';
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'valid-anon-key-abc';
      process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key';

      const adminClient = createAdminClient();
      expect(adminClient).toBeDefined();
      expect(typeof adminClient.from).toBe('function');
    });
  });
});
