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
