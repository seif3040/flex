# AI Workspace — Next Task

**Version**: 2.0.0  
**Date**: 2026-11-04  
**Last Updated**: 2026-11-04

---

## Current Status: Supabase Auth Audit Completed & Defect Remediated

**Phase**: 03 — Authentication  
**Status**: Code Ready / Remote Database Schema Execution Pending

---

### External Action Required Before Database Table Operations

The Authentication service and Private Storage bucket (`user-uploads`) are 100% operational on remote Supabase project `wzvllcifkdfnvnvsqdqr`.
However, remote PostgreSQL application tables (`profiles`, `conversations`, `messages`, etc.) must be created:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/wzvllcifkdfnvnvsqdqr).
2. Navigate to the **SQL Editor**.
3. Copy the entire contents of [`supabase/full_schema.sql`](file:///d:/flex/supabase/full_schema.sql).
4. Paste and click **Run**.

Once executed, PostgREST will immediately expose all 8 tables and enable default-deny RLS.

---

## Authorized Next Task: P04-T01 — Root Layout with Theme Provider

**Phase**: 04 — Dashboard Shell & Sidebar Layout  
**Task ID**: P04-T01  
**Depends on**: Phase 03 completed ✅

### What This Task Does

Implements theme state management and app chrome foundations:
1. `src/components/providers/theme-provider.tsx`:
   - System theme detection (prefers-color-scheme).
   - Light / Dark / System mode toggle with localStorage persistence.
   - Prevents flash of unstyled theme (FOUT/theme flickering).
2. `src/app/layout.tsx`:
   - Wraps the application tree in the theme provider.
   - Sets correct font classes, accessibility attributes, and metadata.
3. Theme toggle component:
   - Accessible button in navigation / header with Sun/Moon icons.
4. Automated tests:
   - Unit tests for theme provider and theme toggle component.

### Files That Will Be Created or Modified

```
src/components/providers/theme-provider.tsx
src/components/ui/theme-toggle.tsx
src/app/layout.tsx
tests/unit/components/theme-provider.test.tsx
```

### Acceptance Criteria

- [ ] Theme provider supports 'light', 'dark', and 'system'
- [ ] Changing theme updates `<html class="dark">` or `<html class="light">`
- [ ] Initial render respects system preferences without hydration mismatch
- [ ] TypeScript strict mode (`npm run type-check`), ESLint, and all tests pass with 0 errors
