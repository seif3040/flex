/**
 * @vitest-environment node
 *
 * Real Supabase Auth & Database RLS Integration Test Suite
 * Connects directly to the live remote Supabase instance (wzvllcifkdfnvnvsqdqr.supabase.co).
 * Verifies live auth, multi-tenant RLS isolation, storage policies, and auto triggers.
 * Safely cleans up all created test users and files after completion.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('Live Supabase Auth & Database RLS Integration Audit', () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;
  const createdUserIds: string[] = [];
  const uploadedFilePaths: string[] = [];

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
    // 1. Clean up any uploaded test files
    if (uploadedFilePaths.length > 0) {
      try {
        await adminClient.storage.from('user-uploads').remove(uploadedFilePaths);
      } catch {
        // Ignore file cleanup error
      }
    }

    // 2. Clean up all created test users from live Supabase auth instance
    for (const userId of createdUserIds) {
      try {
        await adminClient.auth.admin.deleteUser(userId);
      } catch {
        // Ignore deletion errors in teardown
      }
    }
  }, 30000);

  it('[LIVE] verifies connection to remote Supabase Auth service', async () => {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    expect(error).toBeNull();
    expect(data?.users).toBeDefined();
  });

  it('[LIVE] confirms all 8 application tables exist and are queryable', async () => {
    const tables = [
      'profiles',
      'api_keys',
      'projects',
      'conversations',
      'messages',
      'files',
      'artifacts',
      'memory_entries',
    ];

    for (const table of tables) {
      const { error } = await adminClient.from(table).select('*').limit(0);
      expect(error).toBeNull();
    }
  }, 15000);

  it('[LIVE] verifies signup requires email confirmation (no active session returned)', async () => {
    const probeEmail = `aiworkspace.audit.${Date.now()}@gmail.com`;
    const probePassword = 'AuditPassword123!';

    const { data, error } = await anonClient.auth.signUp({
      email: probeEmail,
      password: probePassword,
    });

    if (error?.code === 'over_email_send_rate_limit') {
      expect(error.message).toMatch(/rate limit/i);
    } else {
      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.id).toBeDefined();
      if (data.user?.id) {
        createdUserIds.push(data.user.id);
      }
      expect(data.session).toBeNull();
      expect(data.user?.confirmation_sent_at).toBeDefined();
    }
  });

  it('[LIVE] verifies unconfirmed user cannot sign in with password', async () => {
    const probeEmail = `aiworkspace.unconf.${Date.now()}@gmail.com`;
    const probePassword = 'AuditPassword123!';

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
    expect(loginError?.message).toMatch(/email not confirmed|invalid login credentials/i);
  });

  it('[LIVE] verifies confirmed user can sign in, validate token, and sign out', async () => {
    const confirmedEmail = `aiworkspace.confirmed.${Date.now()}@gmail.com`;
    const confirmedPassword = 'ConfirmedPassword123!';

    const { data: adminUser, error: createError } = await adminClient.auth.admin.createUser({
      email: confirmedEmail,
      password: confirmedPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Audit Confirmed User' },
    });

    expect(createError).toBeNull();
    expect(adminUser.user?.id).toBeDefined();
    createdUserIds.push(adminUser.user!.id);

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

    const { data: tokenUserData, error: tokenError } = await sessionClient.auth.getUser(
      sessionData.session!.access_token
    );
    expect(tokenError).toBeNull();
    expect(tokenUserData.user?.id).toBe(adminUser.user!.id);

    const { error: signoutError } = await sessionClient.auth.signOut();
    expect(signoutError).toBeNull();
  });

  it('[LIVE] verifies handle_new_user trigger automatically creates public.profiles row', async () => {
    const testEmail = `aiworkspace.trigger.${Date.now()}@gmail.com`;
    const testPass = 'TriggerPassword123!';

    const { data: userRes, error } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { full_name: 'Grace Hopper' },
    });

    expect(error).toBeNull();
    const userId = userRes.user!.id;
    createdUserIds.push(userId);

    const { data: profile, error: profErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    expect(profErr).toBeNull();
    expect(profile.id).toBe(userId);
    expect(profile.display_name).toBe('Grace Hopper');
  });

  it('[LIVE] verifies anonymous access is denied across all tables', async () => {
    const tables = [
      'profiles',
      'api_keys',
      'projects',
      'conversations',
      'messages',
      'files',
      'artifacts',
      'memory_entries',
    ];

    for (const table of tables) {
      const { data } = await anonClient.from(table).select('*');
      expect(data).toEqual([]);
    }
  });

  it('[LIVE] verifies strict multi-tenant RLS isolation between User A and User B', async () => {
    const ts = Date.now();
    const userAEmail = `audit.usera.${ts}@gmail.com`;
    const userBEmail = `audit.userb.${ts}@gmail.com`;
    const testPass = 'IsolationPass123!';

    // Create User A and User B
    const { data: uA } = await adminClient.auth.admin.createUser({
      email: userAEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { full_name: 'User A' },
    });
    const { data: uB } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { full_name: 'User B' },
    });

    const userAId = uA.user!.id;
    const userBId = uB.user!.id;
    createdUserIds.push(userAId, userBId);

    // Sign in User A
    const clientA = createClient(url!, anonKey!, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: userAEmail, password: testPass });

    // User A inserts data
    const { data: convA } = await clientA
      .from('conversations')
      .insert({
        user_id: userAId,
        title: 'User A Confidential Conversation',
        model_id: 'anthropic/claude-3.5-sonnet',
      })
      .select()
      .single();

    expect(convA?.id).toBeDefined();

    const { data: msgA } = await clientA
      .from('messages')
      .insert({
        conversation_id: convA!.id,
        user_id: userAId,
        role: 'user',
        content: 'Secret user message',
      })
      .select()
      .single();

    expect(msgA?.id).toBeDefined();

    const { data: artA } = await clientA
      .from('artifacts')
      .insert({
        conversation_id: convA!.id,
        message_id: msgA!.id,
        user_id: userAId,
        title: 'Secret Code Artifact',
        language: 'python',
        content: 'secret_key = 123',
      })
      .select()
      .single();

    expect(artA?.id).toBeDefined();

    const { data: keyA } = await clientA
      .from('api_keys')
      .insert({
        user_id: userAId,
        encrypted_key: 'enc_test_key_blob',
        key_hint: 'sk-or-v1-abc...xyz',
      })
      .select()
      .single();

    expect(keyA?.id).toBeDefined();

    // Sign in User B
    const clientB = createClient(url!, anonKey!, { auth: { persistSession: false } });
    await clientB.auth.signInWithPassword({ email: userBEmail, password: testPass });

    // 1. User B cannot SELECT User A data
    const { data: bConvs } = await clientB.from('conversations').select('*').eq('id', convA!.id);
    expect(bConvs).toEqual([]);

    const { data: bMsgs } = await clientB.from('messages').select('*').eq('id', msgA!.id);
    expect(bMsgs).toEqual([]);

    const { data: bArts } = await clientB.from('artifacts').select('*').eq('id', artA!.id);
    expect(bArts).toEqual([]);

    const { data: bKeys } = await clientB.from('api_keys').select('*').eq('user_id', userAId);
    expect(bKeys).toEqual([]);

    // 2. User B cannot UPDATE User A data
    const { data: bUpdate } = await clientB
      .from('conversations')
      .update({ title: 'Hacked Title' })
      .eq('id', convA!.id)
      .select();
    expect(bUpdate).toEqual([]);

    // 3. User B cannot DELETE User A data
    const { data: bDelete } = await clientB
      .from('conversations')
      .delete()
      .eq('id', convA!.id)
      .select();
    expect(bDelete).toEqual([]);

    // 4. User B cannot inject a message or artifact into User A's conversation
    const { error: injectMsgErr } = await clientB.from('messages').insert({
      conversation_id: convA!.id,
      user_id: userBId,
      role: 'user',
      content: 'Injection attempt',
    });
    expect(injectMsgErr).toBeDefined();
    expect(injectMsgErr?.message).toMatch(/row-level security/i);

    const { error: injectArtErr } = await clientB.from('artifacts').insert({
      conversation_id: convA!.id,
      message_id: msgA!.id,
      user_id: userBId,
      title: 'Injected Artifact',
      content: 'evil()',
    });
    expect(injectArtErr).toBeDefined();
    expect(injectArtErr?.message).toMatch(/row-level security/i);
  }, 15000);

  it('[LIVE] verifies private user-uploads bucket and storage ownership isolation', async () => {
    const ts = Date.now();
    const userAEmail = `storage.usera.${ts}@gmail.com`;
    const userBEmail = `storage.userb.${ts}@gmail.com`;
    const testPass = 'StoragePass123!';

    const { data: uA } = await adminClient.auth.admin.createUser({
      email: userAEmail,
      password: testPass,
      email_confirm: true,
    });
    const { data: uB } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      password: testPass,
      email_confirm: true,
    });

    const userAId = uA.user!.id;
    const userBId = uB.user!.id;
    createdUserIds.push(userAId, userBId);

    const clientA = createClient(url!, anonKey!, { auth: { persistSession: false } });
    await clientA.auth.signInWithPassword({ email: userAEmail, password: testPass });

    const clientB = createClient(url!, anonKey!, { auth: { persistSession: false } });
    await clientB.auth.signInWithPassword({ email: userBEmail, password: testPass });

    // User A uploads a file to user-uploads/{userAId}/doc.txt
    const filePath = `${userAId}/test-document.txt`;
    uploadedFilePaths.push(filePath);

    const { data: uploadData, error: uploadErr } = await clientA.storage
      .from('user-uploads')
      .upload(filePath, Buffer.from('Confidential report'), { contentType: 'text/plain' });

    expect(uploadErr).toBeNull();
    expect(uploadData?.path).toBe(filePath);

    // User B attempts to download User A file
    const { data: dlData, error: dlErr } = await clientB.storage
      .from('user-uploads')
      .download(filePath);

    expect(dlData).toBeNull();
    expect(dlErr).toBeDefined();
    expect(dlErr?.message).toMatch(/not found/i);
  });
});
