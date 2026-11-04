# AI Workspace — Next Task

**Version**: 2.0.0  
**Date**: 2026-11-04  
**Last Updated**: 2026-11-04

---

## Authorized Next Task: P03-T02 — Login & Signup Pages

**Phase**: 03 — Authentication  
**Task ID**: P03-T02  
**Depends on**: Phase 02 completed ✅, P03-T01 completed ✅

---

### What This Task Does

Implements the user-facing authentication screens using the project's design system:
1. `src/app/login/page.tsx`:
   - Clean, accessible sign-in form using shadcn/ui components (`Input`, `Button`, `Label`).
   - Email/password authentication via `supabase.auth.signInWithPassword`.
   - Respects `next` query parameter after successful sign-in.
   - Displays clear, user-friendly error banners on invalid credentials or callback errors.
2. `src/app/signup/page.tsx`:
   - User registration form with email, password, and display name.
   - Client and server validation (minimum 8 characters, valid email).
   - Sign up via `supabase.auth.signUp`.
   - Clear post-signup confirmation notice (check email for verification link).
3. Client auth form components and state management:
   - Loading states and disabled submit buttons during in-flight requests.
   - Clean navigation links between login and signup screens.
4. Automated tests:
   - Unit/component tests verifying validation, error states, and submission callbacks.

### Files That Will Be Created or Modified

```
src/app/login/page.tsx
src/app/signup/page.tsx
src/components/auth/login-form.tsx
src/components/auth/signup-form.tsx
tests/unit/auth/login-form.test.tsx
tests/unit/auth/signup-form.test.tsx
```

### Acceptance Criteria

- [ ] `/login` renders clean email/password form with validation
- [ ] `/signup` renders registration form with display name and password confirmation
- [ ] Successful login redirects to sanitized `next` parameter or `/`
- [ ] In-flight submissions display loading spinner and prevent duplicate submissions
- [ ] Auth errors (bad credentials, user already exists) display accessible inline error messages
- [ ] TypeScript strict mode (`npm run type-check`), ESLint, and all tests pass with 0 errors
