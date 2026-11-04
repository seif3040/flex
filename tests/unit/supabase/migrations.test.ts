import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Supabase Database Migrations (P02-T02)', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');

  const files = {
    initialSchema: path.join(migrationsDir, '20261104000001_initial_schema.sql'),
    rlsPolicies: path.join(migrationsDir, '20261104000002_rls_policies.sql'),
    storageBucket: path.join(migrationsDir, '20261104000003_storage_bucket.sql'),
    triggers: path.join(migrationsDir, '20261104000004_triggers.sql'),
  };

  it('all expected migration files exist in supabase/migrations', () => {
    expect(fs.existsSync(files.initialSchema)).toBe(true);
    expect(fs.existsSync(files.rlsPolicies)).toBe(true);
    expect(fs.existsSync(files.storageBucket)).toBe(true);
    expect(fs.existsSync(files.triggers)).toBe(true);
  });

  describe('20261104000001_initial_schema.sql', () => {
    const sql = fs.readFileSync(files.initialSchema, 'utf8');

    const expectedTables = [
      'profiles',
      'api_keys',
      'projects',
      'conversations',
      'messages',
      'files',
      'artifacts',
      'memory_entries',
    ];

    it.each(expectedTables)('creates table %s', (tableName) => {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${tableName}`);
    });

    it('enforces foreign keys to auth.users with ON DELETE CASCADE', () => {
      expect(sql).toContain('REFERENCES auth.users(id) ON DELETE CASCADE');
    });

    it('creates performance indexes for foreign key relationships', () => {
      expect(sql).toContain('idx_projects_user_id');
      expect(sql).toContain('idx_conversations_user_id');
      expect(sql).toContain('idx_conversations_project_id');
      expect(sql).toContain('idx_messages_conversation');
      expect(sql).toContain('idx_messages_user_id');
      expect(sql).toContain('idx_files_user_id');
      expect(sql).toContain('idx_artifacts_user_id');
      expect(sql).toContain('idx_memory_entries_user_id');
    });
  });

  describe('20261104000002_rls_policies.sql', () => {
    const sql = fs.readFileSync(files.rlsPolicies, 'utf8');

    const expectedTables = [
      'profiles',
      'api_keys',
      'projects',
      'conversations',
      'messages',
      'files',
      'artifacts',
      'memory_entries',
    ];

    it.each(expectedTables)('enables and forces RLS on %s', (tableName) => {
      expect(sql).toContain(`ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`);
      expect(sql).toContain(`ALTER TABLE public.${tableName} FORCE ROW LEVEL SECURITY;`);
    });

    it('uses TO authenticated and optimized (SELECT auth.uid()) pattern', () => {
      expect(sql).toContain('TO authenticated');
      expect(sql).toContain('(SELECT auth.uid())');
      // Deprecated auth.role() should never be used
      expect(sql).not.toContain('auth.role()');
    });

    it('enforces joined ownership on messages and artifacts', () => {
      expect(sql).toContain('EXISTS (\n      SELECT 1 FROM public.conversations c\n      WHERE c.id = messages.conversation_id');
      expect(sql).toContain('EXISTS (\n      SELECT 1 FROM public.conversations c\n      WHERE c.id = artifacts.conversation_id');
    });
  });

  describe('20261104000003_storage_bucket.sql', () => {
    const sql = fs.readFileSync(files.storageBucket, 'utf8');

    it('creates private user-uploads bucket with 20MB limit and mime restrictions', () => {
      expect(sql).toContain("'user-uploads'");
      expect(sql).toContain('false'); // public = false
      expect(sql).toContain('20971520'); // 20 MB limit
      expect(sql).toContain("'application/pdf'");
    });

    it('implements SELECT, INSERT, UPDATE, and DELETE policies for storage upsert support', () => {
      expect(sql).toContain('"user_uploads_select"');
      expect(sql).toContain('"user_uploads_insert"');
      expect(sql).toContain('"user_uploads_update"');
      expect(sql).toContain('"user_uploads_delete"');
      expect(sql).toContain('(storage.foldername(name))[1] = (SELECT auth.uid())::text');
    });
  });

  describe('20261104000004_triggers.sql', () => {
    const sql = fs.readFileSync(files.triggers, 'utf8');

    it('creates handle_new_user trigger on auth.users', () => {
      expect(sql).toContain('FUNCTION public.handle_new_user()');
      expect(sql).toContain('SECURITY DEFINER');
      expect(sql).toContain('SET search_path = public, auth');
      expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;');
      expect(sql).toContain('CREATE TRIGGER on_auth_user_created');
      expect(sql).toContain('AFTER INSERT ON auth.users');
    });

    it('creates handle_updated_at function and triggers', () => {
      expect(sql).toContain('FUNCTION public.handle_updated_at()');
      expect(sql).toContain('trg_profiles_updated_at');
      expect(sql).toContain('trg_conversations_updated_at');
    });
  });
});
