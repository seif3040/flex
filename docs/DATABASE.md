# AI Workspace — Database Schema

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

---

## 1. Overview

The database is PostgreSQL hosted on Supabase. All tables use Row Level Security (RLS). The `auth.users` table is managed by Supabase Auth — application tables reference it via foreign keys.

---

## 2. Schema

### 2.1 `profiles`

Extended user profile data, one-to-one with `auth.users`.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 `api_keys`

Encrypted OpenRouter API keys per user.

```sql
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,         -- AES-256-GCM encrypted, base64
  key_hint      TEXT,                  -- Last 4 chars of key for display
  label         TEXT DEFAULT 'Default',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)                      -- One key per user for MVP
);
```

### 2.3 `projects`

User-defined project containers.

```sql
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  system_prompt     TEXT,              -- Custom instructions for this project
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.4 `conversations`

Chat conversation containers.

```sql
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  title         TEXT NOT NULL DEFAULT 'New Conversation',
  model_id      TEXT NOT NULL,         -- OpenRouter model ID used
  system_prompt TEXT,                  -- Conversation-level system prompt
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 `messages`

Individual messages within a conversation.

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  model_id        TEXT,                -- Model used for this message (assistant only)
  parent_id       UUID REFERENCES messages(id),  -- For branching
  token_count     INTEGER,
  finish_reason   TEXT,               -- 'stop', 'length', 'tool_calls', etc.
  metadata        JSONB DEFAULT '{}', -- Tool calls, citations, attachments refs
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_parent ON messages(parent_id);
```

### 2.6 `files`

File uploads associated with messages or projects.

```sql
CREATE TABLE files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  storage_path    TEXT NOT NULL,       -- Supabase Storage path
  original_name   TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  extracted_text  TEXT,               -- Extracted text content for context
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.7 `artifacts`

Code or content artifacts generated in conversations.

```sql
CREATE TABLE artifacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES messages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  language        TEXT NOT NULL DEFAULT 'text',
  content         TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  parent_id       UUID REFERENCES artifacts(id), -- For versioning
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.8 `memory_entries`

User-controlled memory facts injected into prompts.

```sql
CREATE TABLE memory_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Row Level Security Policies

Every table must have RLS enabled. Standard pattern:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rows
CREATE POLICY "Users own their data" ON <table>
  FOR ALL USING (auth.uid() = user_id);
```

Specific policies for joined access (e.g., messages accessed via conversation ownership) are defined in migration files.

---

## 4. Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `user-uploads` | User file uploads | Private, per-user path |

Storage path convention: `user-uploads/{user_id}/{conversation_id}/{filename}`

Storage policies mirror database RLS — users can only read/write their own paths.

---

## 5. Generated Types

After schema changes, run:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

The `src/types/database.ts` file is auto-generated. Never edit it manually.

---

## 6. Migration Files

All schema changes go through versioned SQL files in `supabase/migrations/`.

Format: `{timestamp}_{description}.sql`

Example: `20261104000001_initial_schema.sql`
