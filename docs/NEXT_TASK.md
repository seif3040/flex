# AI Workspace — Next Task

**Version**: 2.0.0  
**Date**: 2026-11-04  
**Last Updated**: 2026-11-04

---

## Authorized Next Task: P03-T01 — Next.js 16 Proxy Route Guard & Auth Callback

**Phase**: 03 — Authentication  
**Task ID**: P03-T01  
**Depends on**: Phase 02 completed ✅, Supabase live connection verified ✅

---

### What This Task Does

Implements the Next.js 16 server-side session authentication boundary:
1. `src/proxy.ts` (Next.js 16 Proxy convention, formerly middleware.ts):
   - Integrates `updateSession(request)` to refresh tokens on incoming requests.
   - Enforces authentication guard: unauthenticated requests to protected paths (`/c/*`, `/projects/*`, `/settings/*`, `/api/*` except public auth endpoints) redirect to `/login` or return `401 Unauthorized`.
   - Allows public assets (`_next`, static, favicon, `/login`, `/signup`, `/auth/*`) through without redirection.
2. `src/app/auth/callback/route.ts`:
   - Next.js Route Handler for handling Supabase OAuth redirects and email verification code exchange (`supabase.auth.exchangeCodeForSession(code)`).
3. `src/lib/auth/session.ts`:
   - Helper function `getServerUser()` and `requireAuth()` for Route Handlers and Server Components to safely access verified user context without client spoofing.
4. Unit tests:
   - `tests/unit/auth/proxy.test.ts` verifying path matching, redirect rules, and public route passthrough.

### Files That Will Be Created

```
src/proxy.ts
src/app/auth/callback/route.ts
src/lib/auth/session.ts
tests/unit/auth/proxy.test.ts
```

### Acceptance Criteria

- [ ] `proxy.ts` exports `proxy` function conforming to Next.js 16 Proxy specification
- [ ] Protected routes (`/c/:id`, `/settings`, private APIs) reject unauthenticated requests
- [ ] Public routes (`/login`, `/signup`, `/auth/callback`) remain accessible
- [ ] Auth callback route properly exchanges code for session
- [ ] TypeScript strict mode (`npm run type-check`) and all tests pass with 0 errors
