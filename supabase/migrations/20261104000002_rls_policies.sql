-- ==============================================================================
-- Migration: 20261104000002_rls_policies.sql
-- Description: Row Level Security Policies (Default-Deny + Ownership Rules)
-- Phase: 02 - Supabase Setup & Database Schema
-- Task: P02-T02
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable and Force RLS on all 8 tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files FORCE ROW LEVEL SECURITY;

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_entries FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. profiles Policies (one-to-one with auth.users)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. api_keys Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
CREATE POLICY "api_keys_select_own"
  ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
CREATE POLICY "api_keys_insert_own"
  ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "api_keys_update_own" ON public.api_keys;
CREATE POLICY "api_keys_update_own"
  ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "api_keys_delete_own" ON public.api_keys;
CREATE POLICY "api_keys_delete_own"
  ON public.api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. projects Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 5. conversations Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
CREATE POLICY "conversations_select_own"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
CREATE POLICY "conversations_insert_own"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;
CREATE POLICY "conversations_update_own"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "conversations_delete_own" ON public.conversations;
CREATE POLICY "conversations_delete_own"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. messages Policies (Joined conversation ownership)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
CREATE POLICY "messages_delete_own"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 7. files Policies (Direct ownership + optional conversation relationship check)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "files_select_own" ON public.files;
CREATE POLICY "files_select_own"
  ON public.files
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = files.conversation_id
          AND c.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "files_insert_own" ON public.files;
CREATE POLICY "files_insert_own"
  ON public.files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = files.conversation_id
          AND c.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "files_update_own" ON public.files;
CREATE POLICY "files_update_own"
  ON public.files
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = files.conversation_id
          AND c.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = files.conversation_id
          AND c.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "files_delete_own" ON public.files;
CREATE POLICY "files_delete_own"
  ON public.files
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = files.conversation_id
          AND c.user_id = (SELECT auth.uid())
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 8. artifacts Policies (Joined conversation ownership)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "artifacts_select_own" ON public.artifacts;
CREATE POLICY "artifacts_select_own"
  ON public.artifacts
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = artifacts.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "artifacts_insert_own" ON public.artifacts;
CREATE POLICY "artifacts_insert_own"
  ON public.artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = artifacts.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "artifacts_update_own" ON public.artifacts;
CREATE POLICY "artifacts_update_own"
  ON public.artifacts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = artifacts.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = artifacts.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "artifacts_delete_own" ON public.artifacts;
CREATE POLICY "artifacts_delete_own"
  ON public.artifacts
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = artifacts.conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- ------------------------------------------------------------------------------
-- 9. memory_entries Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "memory_entries_select_own" ON public.memory_entries;
CREATE POLICY "memory_entries_select_own"
  ON public.memory_entries
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "memory_entries_insert_own" ON public.memory_entries;
CREATE POLICY "memory_entries_insert_own"
  ON public.memory_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "memory_entries_update_own" ON public.memory_entries;
CREATE POLICY "memory_entries_update_own"
  ON public.memory_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "memory_entries_delete_own" ON public.memory_entries;
CREATE POLICY "memory_entries_delete_own"
  ON public.memory_entries
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 10. Grant table access to authenticated role
-- PostgREST requires table-level grants so that RLS policies can be evaluated
-- ------------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.artifacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.memory_entries TO authenticated;

-- Service role has full administrative access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
