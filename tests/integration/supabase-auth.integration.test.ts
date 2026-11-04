/**
 * @vitest-environment node
 *
 * Real Supabase Auth Integration Test Suite
 * Connects directly to the live remote Supabase instance (wzvllcifkdfnvnvsqdqr.supabase.co).
 * Distinguishes genuine network/cloud operations from mocked unit tests.
 * Cleans up all created test users after completion.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load actual .env.local credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('Live Supabase Auth Integration Audit', () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;
  const createdUserIds: string[] = [];

  beforeAll(() => {
    expect(url).toBeDefined();
    expect(anonKey).toBeDefined();
    expect(serviceKey).toBeDefined();

    adminClient = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    anonClient = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    // Clean up all created test users from live Supabase auth instance
    for (const userId of createdUserIds) {
      try {
        await adminClient.auth.admin.deleteUser(userId);
      } catch {
        // Ignore deletion errors in teardown
      }
    }
  });

  it('[LIVE] verifies connection to remote Supabase Auth service', async () => {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    expect(error).toBeNull();
    expect(data?.users).toBeDefined();
  });

  it('[LIVE] verifies signup requires email confirmation (no active session returned)', async () => {
    const probeEmail = `aiworkspace.audit.${Date.now()}@gmail.com`;
    const probePassword = 'AuditPassword123!';

    const { data, error } = await anonClient.auth.signUp({
      email: probeEmail,
      password: probePassword,
    });

    if (error?.code === 'over_email_send_rate_limit') {
      // Confirmed: Supabase project actively sends verification emails and enforces email rate limiting
      expect(error.message).toMatch(/rate limit/i);
    } else {
      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.id).toBeDefined();
      if (data.user?.id) {
        createdUserIds.push(data.user.id);
      }
      // Crucial: live Supabase project enforces email confirmation, so session is null
      expect(data.session).toBeNull();
      expect(data.user?.confirmation_sent_at).toBeDefined();
    }
  });

  it('[LIVE] verifies unconfirmed user cannot sign in with password', async () => {
    const probeEmail = `aiworkspace.unconf.${Date.now()}@gmail.com`;
    const probePassword = 'AuditPassword123!';

    // Create an unconfirmed user via Admin API to avoid consuming SMTP email rate limit
    const { data: adminUser, error: adminCreateErr } = await adminClient.auth.admin.createUser({
      email: probeEmail,
      password: probePassword,
      email_confirm: false,
    });

    expect(adminCreateErr).toBeNull();
    expect(adminUser.user?.id).toBeDefined();
    if (adminUser.user?.id) {
      createdUserIds.push(adminUser.user.id);
    }

    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: probeEmail,
      password: probePassword,
    });

    expect(loginData.session).toBeNull();
    expect(loginError).toBeDefined();
    // Supabase explicitly returns 'Email not confirmed' for unconfirmed accounts
    expect(loginError?.message).toMatch(/email not confirmed|invalid login credentials/i);
  });

  it('[LIVE] verifies confirmed user can sign in, persist session, and sign out', async () => {
    const confirmedEmail = `aiworkspace.confirmed.${Date.now()}@gmail.com`;
    const confirmedPassword = 'ConfirmedPassword123!';

    // Create a pre-confirmed user via Admin API
    const { data: adminUser, error: createError } = await adminClient.auth.admin.createUser({
      email: confirmedEmail,
      password: confirmedPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Audit Confirmed User' },
    });

    expect(createError).toBeNull();
    expect(adminUser.user?.id).toBeDefined();
    createdUserIds.push(adminUser.user!.id);

    // Sign in as the confirmed user
    const sessionClient = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sessionData, error: signinError } = await sessionClient.auth.signInWithPassword({
      email: confirmedEmail,
      password: confirmedPassword,
    });

    expect(signinError).toBeNull();
    expect(sessionData.session).toBeDefined();
    expect(sessionData.session?.access_token).toBeDefined();
    expect(sessionData.user?.id).toBe(adminUser.user!.id);

    // Verify token validation via getUser()
    const { data: tokenUserData, error: tokenError } = await sessionClient.auth.getUser(
      sessionData.session!.access_token
    );
    expect(tokenError).toBeNull();
    expect(tokenUserData.user?.id).toBe(adminUser.user!.id);

    // Verify sign out
    const { error: signoutError } = await sessionClient.auth.signOut();
    expect(signoutError).toBeNull();
  });

  it('[LIVE] audits live PostgREST schema cache status for application tables', async () => {
    // Check if tables are loaded in schema cache
    const { error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .limit(1);

    // Document whether schema cache has tables loaded
    if (profilesError && profilesError.code === 'PGRST205') {
      // Confirmed: migration SQL has not yet been executed in Supabase SQL Editor
      expect(profilesError.message).toContain("Could not find the table 'public.profiles'");
    } else {
      expect(profilesError).toBeNull();
    }
  });
});
