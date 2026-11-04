# AI Workspace — Next Task

**Version**: 2.0.0  
**Date**: 2026-11-04  
**Last Updated**: 2026-11-04

---

## Authorized Next Task: P02-T02 — Database Migrations (Initial Schema, RLS & Storage)

**Phase**: 02 — Supabase Setup & Database Schema  
**Task ID**: P02-T02  
**Depends on**: `P02-T01` completed ✅, Supabase credentials in `.env.local`

---

### What This Task Does

Creates and applies versioned SQL migrations for Supabase PostgreSQL:
1. `supabase/migrations/20261104000001_initial_schema.sql`:
   - Tables: `profiles`, `api_keys`, `projects`, `conversations`, `messages`, `files`, `artifacts`, `memory_entries`
   - Constraints, foreign keys with `ON DELETE CASCADE / SET NULL`, indexes
2. `supabase/migrations/20261104000002_rls_policies.sql`:
   - Default-deny RLS enabled on all 8 tables
   - User ownership policies (`auth.uid() = user_id`) for SELECT, INSERT, UPDATE, DELETE
   - Joined ownership policies for `messages` and `files`
3. `supabase/migrations/20261104000003_storage_bucket.sql`:
   - Create private `user-uploads` bucket in `storage.buckets`
   - Storage RLS policies restricting read/write to `user-uploads/{auth.uid()}/...`
4. `supabase/migrations/20261104000004_triggers.sql`:
   - `handle_new_user()` trigger on `auth.users` insert to automatically create a `profiles` row

---

### Prerequisites / Action Required From User (Blocker)

Create `d:\flex\.env.local` (copied from `.env.local.example`) and supply:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

And confirm:
- **Decision Q-001**: Supabase Cloud or Local (Docker)?
  - If **Supabase Cloud**: provide the project URL and keys above from your Supabase dashboard (Project Settings → API).
  - If **Local Supabase**: confirm Docker Desktop is running so we can execute `npx supabase start`.
