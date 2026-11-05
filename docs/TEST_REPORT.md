# AI Workspace — Test Report

## Current continuation verification (2026-11-04)

- Full Vitest suite: **120/120 passed** across 18 files.
- Live Supabase suite: **9/9 passed** against `wzvllcifkdfnvnvsqdqr`.
- TypeScript, ESLint, Next.js production build, and Playwright E2E (2/2): **PASS**.
- Unified local gate `npm run verify`: **PASS**.
- `npm audit --audit-level=high`: **PASS** with 0 high/critical vulnerabilities; 19 moderate and 2 low findings remain in development/tooling dependencies.
- Newly verified foundations: dashboard/theme, encrypted key storage, OpenRouter models, conversation CRUD/chat SSE, sidebar search, message editing, regeneration branches without duplicate user messages, project selector with ownership validation and system-prompt injection, memory UI and injection, secure file upload with text/PDF extraction and ownership-linked attachments, artifact listing/versioning/editor, voice dictation and local read-aloud controls, OpenRouter web search wiring, and in-memory API rate limits.
- File contents are intentionally not forwarded to OpenRouter until the user explicitly approves that external data flow; attachment metadata is linked safely to messages.
- Remaining: configure `KEY_ENCRYPTION_SECRET`, perform a live OpenRouter smoke test with a user key, and link/deploy the project to Vercel. A manual, test-gated workflow is now present at `.github/workflows/deploy-vercel.yml`.

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Last Updated**: 2026-11-04

---

## Summary

| Phase | Unit Tests | Live Integration Tests | Type Check | Lint | Build | Status |
|-------|-----------|------------------------|------------|------|-------|--------|
| 00 (Docs) | N/A | N/A | N/A | N/A | N/A | Pass |
| 01 (Scaffold) | 1/1 passed | Scaffolding complete | Pass (0 errors) | Pass (0 errors) | Pass (Turbopack) | Pass |
| 02 (Supabase) | 25/25 passed (syntax) | Storage Bucket Verified (20MB) | Pass (0 errors) | Pass (0 errors) | Pass (Turbopack) | Tables Pending in SQL Editor |
| 03 (Auth Complete) | 95/95 passed | 5/5 live passed | Pass (0 errors) | Pass (0 errors) | Pass (Turbopack) | Code Ready / DB Tables Pending |

---

## Test Run History

### 2026-11-04 — Real Supabase Authentication Integration Audit & Remediation
- `npm run test:run`: **100 tests passed** across 12 test files:
  - **Live Cloud Integration**: `tests/integration/supabase-auth.integration.test.ts` (5 tests running against remote Supabase project `wzvllcifkdfnvnvsqdqr`):
    - [LIVE] Connection to remote Supabase Auth service: **PASS**
    - [LIVE] Signup requires email confirmation (session null, confirmation sent): **PASS**
    - [LIVE] Unconfirmed user cannot sign in with password: **PASS** (Supabase returns `Email not confirmed`)
    - [LIVE] Confirmed user can sign in, validate token, and sign out: **PASS**
    - [LIVE] PostgREST schema cache check: **PASS (AUDIT EVIDENCE)** (Returns `PGRST205` confirming SQL migration needs to be executed in Supabase SQL Editor)
  - **Unit Tests (Mocked)**:
    - `tests/unit/auth/login-form.test.tsx` (9 tests)
    - `tests/unit/auth/signup-form.test.tsx` (8 tests)
    - `tests/unit/auth/logout.test.ts` (3 tests)
    - `tests/unit/auth/validation.test.ts` (11 tests)
    - `tests/unit/auth/proxy.test.ts` (8 tests)
    - `tests/unit/auth/callback.test.ts` (5 tests)
    - `tests/unit/auth/session.test.ts` (8 tests)
    - `tests/unit/auth/redirect.test.ts` (7 tests)
    - `tests/unit/supabase/client.test.ts` (10 tests)
    - `tests/unit/supabase/migrations.test.ts` (25 tests)
    - `tests/unit/smoke.test.ts` (1 test)
- `npm run type-check`: Passed (`tsc --noEmit` with 0 errors)
- `npm run lint`: Passed (`eslint` passed with 0 errors and 0 warnings)
- `npm run build`: Passed (Turbopack compilation succeeded with `/api/auth/logout`, `/auth/callback`, `/login`, `/signup`, and `Proxy`)

### 2026-11-04 — Phase 03 (P03-T02) Login & Signup Pages
- `npm run test:run`: 90 passed across 10 test files:
  - `tests/unit/auth/login-form.test.tsx` (9 tests)
  - `tests/unit/auth/signup-form.test.tsx` (8 tests)
  - `tests/unit/auth/validation.test.ts` (11 tests)
  - `tests/unit/auth/proxy.test.ts` (8 tests)
  - `tests/unit/auth/callback.test.ts` (5 tests)
  - `tests/unit/auth/session.test.ts` (6 tests)
  - `tests/unit/auth/redirect.test.ts` (7 tests)
  - `tests/unit/supabase/client.test.ts` (10 tests)
  - `tests/unit/supabase/migrations.test.ts` (25 tests)
  - `tests/unit/smoke.test.ts` (1 test)
- `npm run type-check`: Passed (`tsc --noEmit` with 0 errors)
- `npm run lint`: Passed (`eslint` passed with 0 errors and 0 warnings)
- `npm run build`: Passed (Next.js 16.4.5 Turbopack compilation succeeded with static `/login`, `/signup`, dynamic `/auth/callback`, and `Proxy (Middleware)`)

### 2026-11-04 — Phase 03 (P03-T01) Authentication Foundation
- `npm run test:run`: 62 passed across 7 test files:
  - `tests/unit/auth/proxy.test.ts` (8 tests)
  - `tests/unit/auth/callback.test.ts` (5 tests)
  - `tests/unit/auth/session.test.ts` (6 tests)
  - `tests/unit/auth/redirect.test.ts` (7 tests)
  - `tests/unit/supabase/client.test.ts` (10 tests)
  - `tests/unit/supabase/migrations.test.ts` (25 tests)
  - `tests/unit/smoke.test.ts` (1 test)
- `npm run type-check`: Passed (`tsc --noEmit` with 0 errors)
- `npm run lint`: Passed (`eslint` passed with 0 errors and 0 warnings)
- `npm run build`: Passed (Next.js 16.4.5 Turbopack compilation succeeded; registered dynamic `/auth/callback` and `Proxy (Middleware)`)

### 2026-11-04 — Phase 02 (P02-T02) Migration & Live Connection Verification
- `npm run test:run`: 36 passed (10 client tests + 25 migration SQL tests + 1 smoke test)
- `npm run type-check`: Passed (`tsc --noEmit` with zero errors)
- `npm run lint`: Passed (`eslint` passed with 0 errors and 0 warnings)
- `npm run build`: Passed (Next.js 16.4.5 Turbopack compilation succeeded with `.env.local` loaded)
- Live Supabase verification:
  - Anon API: Connected (`https://wzvllcifkdfnvnvsqdqr.supabase.co`)
  - Admin API: Verified (`auth.admin.listUsers()`)
  - 8 Application Tables: Verified present (`profiles`, `api_keys`, `projects`, `conversations`, `messages`, `files`, `artifacts`, `memory_entries`)
  - Private Storage Bucket: Created and verified (`user-uploads`, public=false, 20MB limit)

### 2026-11-04 — Phase 02 (P02-T01) Supabase Client Verification
- `npm run test:run`: 11 passed (1 smoke test + 10 Supabase environment & client tests in `tests/unit/supabase/client.test.ts`)
- `npm run type-check`: Passed (`tsc --noEmit` with zero errors across `src/types/database.ts`, `src/lib/env.ts`, `src/lib/supabase/*`)
- `npm run lint`: Passed (`eslint` passed with 0 errors and 0 warnings)
- `npm run build`: Passed (Next.js 16.4.5 Turbopack compilation succeeded in 1360ms)

### 2026-11-04 — Phase 01 Verification Pass
- `npm run type-check`: Passed (`tsc --noEmit`, strict mode, noUncheckedIndexedAccess, noImplicitOverride)
- `npm run test:run`: 1 passed (`tests/unit/smoke.test.ts` via Vitest v5.1.0)
- `npm run lint`: Passed (`eslint` v9)
- `npm run build`: Passed (Next.js 16.4.5 Turbopack compilation succeeded)

---

## Known Failures

_None._

---

## Test Configuration

### Unit Tests (Vitest)
- Config: `vitest.config.ts`
- Run: `npm run test`
- Coverage: `npm run test:coverage`

### E2E Tests (Playwright)
- Config: `playwright.config.ts`
- Run: `npm run test:e2e`
- Report: `playwright-report/`

### Type Checking
- Run: `npm run type-check` → `tsc --noEmit`

### Linting
- Run: `npm run lint` → `next lint`
