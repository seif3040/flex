-- ==============================================================================
-- Migration: 20261104000001_initial_schema.sql
-- Description: AI Workspace Initial Schema (8 Application Tables + Indexes)
-- Phase: 02 - Supabase Setup & Database Schema
-- Task: P02-T02
-- ==============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile data, one-to-one with auth.users';

-- ------------------------------------------------------------------------------
-- 2. api_keys
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  key_hint      TEXT,
  label         TEXT DEFAULT 'Default',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT api_keys_user_id_key UNIQUE(user_id)
);

COMMENT ON TABLE public.api_keys IS 'AES-256-GCM encrypted OpenRouter API keys per user';

-- ------------------------------------------------------------------------------
-- 3. projects
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'User-defined project containers';

-- ------------------------------------------------------------------------------
-- 4. conversations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title         TEXT NOT NULL DEFAULT 'New Conversation',
  model_id      TEXT NOT NULL,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.conversations IS 'Chat conversation containers';

-- ------------------------------------------------------------------------------
-- 5. messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  model_id        TEXT,
  parent_id       UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  token_count     INTEGER,
  finish_reason   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'Individual messages within conversations with branching support';

-- ------------------------------------------------------------------------------
-- 6. files
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  message_id      UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  storage_path    TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  extracted_text  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.files IS 'File metadata for uploads stored in user-uploads bucket';

-- ------------------------------------------------------------------------------
-- 7. artifacts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artifacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id      UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  language        TEXT NOT NULL DEFAULT 'text',
  content         TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  parent_id       UUID REFERENCES public.artifacts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.artifacts IS 'Code and content artifacts generated in chat sessions';

-- ------------------------------------------------------------------------------
-- 8. memory_entries
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memory_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.memory_entries IS 'User-controlled memory facts injected into AI prompts';

-- ------------------------------------------------------------------------------
-- Indexes for Foreign Keys and Query Performance
-- ------------------------------------------------------------------------------
-- projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON public.messages(parent_id);

-- files
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON public.files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_message_id ON public.files(message_id);

-- artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON public.artifacts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON public.artifacts(message_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_parent ON public.artifacts(parent_id);

-- memory_entries
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_id ON public.memory_entries(user_id);

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

-- ==============================================================================
-- Migration: 20261104000003_storage_bucket.sql
-- Description: Private 'user-uploads' Storage Bucket and Policies
-- Phase: 02 - Supabase Setup & Database Schema
-- Task: P02-T02
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Private Storage Bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  20971520, -- 20 MB limit per file (docs/SECURITY.md)
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ];

-- ------------------------------------------------------------------------------
-- 2. Storage Policies on storage.objects
-- Path convention: user-uploads/{user_id}/{conversation_id}/{filename}
-- Authenticated users can only read/write objects under their own user_id folder
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_uploads_select" ON storage.objects;
CREATE POLICY "user_uploads_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "user_uploads_insert" ON storage.objects;
CREATE POLICY "user_uploads_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "user_uploads_update" ON storage.objects;
CREATE POLICY "user_uploads_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "user_uploads_delete" ON storage.objects;
CREATE POLICY "user_uploads_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ==============================================================================
-- Migration: 20261104000004_triggers.sql
-- Description: Automatic Profile Creation Trigger & updated_at Timestamp Triggers
-- Phase: 02 - Supabase Setup & Database Schema
-- Task: P02-T02
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Automatic Profile Creation on auth.users insert
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create a public.profiles row upon auth.users signup';

-- Revoke direct execution from public roles for security
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. Generic updated_at timestamp trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function to auto-update updated_at timestamp on row modification';

-- profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- api_keys
DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- projects
DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- conversations
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- memory_entries
DROP TRIGGER IF EXISTS trg_memory_entries_updated_at ON public.memory_entries;
CREATE TRIGGER trg_memory_entries_updated_at
  BEFORE UPDATE ON public.memory_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
