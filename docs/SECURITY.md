# AI Workspace — Security Model

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

---

## 1. Authentication

- Supabase Auth handles all authentication (email/password, magic link).
- Next.js middleware (`src/middleware.ts`) guards all `/dashboard`, `/api` (except public), and other protected routes.
- Session tokens are httpOnly cookies managed by `@supabase/ssr`.
- Every API route handler verifies the session before processing.

---

## 2. Authorization

- Every resource (conversation, file, message, project) has a `user_id` column.
- Supabase Row Level Security (RLS) is **enabled on all application tables**.
- API routes additionally perform explicit ownership checks before returning data to prevent logic errors from bypassing RLS.
- No service-role key is ever used in client-side code.

---

## 3. API Key Encryption

User OpenRouter keys are **encrypted at rest** using authenticated symmetric encryption.

**Algorithm**: AES-256-GCM  
**Key derivation**: The raw 32-byte encryption secret is sourced from `KEY_ENCRYPTION_SECRET` environment variable (server-only, never exposed to the client).  
**Storage format**: `base64(iv[12] || authTag[16] || ciphertext)`  
**IV**: 12 random bytes, generated per encryption operation.  
**Authentication tag**: 16 bytes, verifies integrity at decryption.

The key is decrypted only server-side within the API route that needs it. It is **never** logged, returned to the client, or included in error messages.

**Key rotation**: Supported by re-encrypting with a new secret and updating `KEY_ENCRYPTION_SECRET`.

---

## 4. API Route Security Checklist

Every private API route MUST:

- [ ] Call `createServerSupabaseClient()` and verify session
- [ ] Return `401` if no session
- [ ] Parse and validate body with Zod
- [ ] Return `400` on validation failure
- [ ] Verify resource ownership (user_id match)
- [ ] Return `403` on ownership mismatch
- [ ] Never log credentials or message content
- [ ] Never expose internal error details to the client

---

## 5. Rate Limiting

Expensive endpoints require rate limiting:

| Endpoint | Limit |
|----------|-------|
| `POST /api/chat` | 60 requests / user / minute |
| `POST /api/files` | 20 uploads / user / hour |
| `GET /api/models` | Cached; 1 upstream call / 5 min |
| `POST /api/keys` | 10 / user / hour |

Implementation: In-memory rate limiter in Phase 1; upgrade to Redis/Upstash in production.

---

## 6. File Upload Security

- **Size limit**: 20 MB per file.
- **Type validation**: MIME type verified by magic bytes (not extension alone) using `file-type` package.
- **Allowed types**: PDF, plain text, Markdown, PNG, JPEG, WebP, GIF.
- **Storage**: Files stored in private Supabase Storage bucket with path `user-uploads/{user_id}/{...}`.
- **Path traversal**: Supabase Storage handles isolation. Upload paths are constructed server-side, never from raw user input.
- **Extracted text**: Sanitized and stored server-side. It is not forwarded to an AI provider by default; any future document-analysis flow must require explicit user consent and clearly identify the external destination.

---

## 7. Artifact Isolation

AI-generated code artifacts must NOT have access to:
- Application cookies
- Application `localStorage`
- The user's auth session
- OpenRouter keys
- Any parent-frame JavaScript context

**Implementation**:
- Artifact preview is served from a sandboxed `<iframe>` with `sandbox="allow-scripts"` (no `allow-same-origin`).
- In production, the preview page should be served from a **separate subdomain** (e.g., `preview.aiworkspace.app`) to enforce cookie isolation at the browser level.

---

## 8. Voice / Microphone

- Microphone access requires explicit user gesture and browser permission prompt.
- The application never silently requests microphone access.
- An indicator shows when the microphone is active.
- Microphone access is released immediately when the user stops recording.

---

## 9. SSRF Prevention

The only outbound HTTP calls the server makes are:
1. `api.openrouter.ai` — for AI inference and model listings.
2. `supabase.co` — for database and storage.
3. Web search provider — URL-validated, response sanitized.

User-controlled URLs (e.g., web search queries) are passed as query strings, never fetched server-side from arbitrary user-supplied URLs.

---

## 10. XSS Prevention

- React's default JSX escaping handles most XSS prevention.
- Markdown is rendered via `react-markdown` with a custom renderer — no `dangerouslySetInnerHTML` on untrusted content.
- Artifact previews are sandboxed (see Section 7).
- Content Security Policy headers are set in `next.config.ts`.

---

## 11. Secrets Management

**Never committed to source control**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `KEY_ENCRYPTION_SECRET`
- Any OpenRouter API keys

**Template**: `.env.local.example` lists required variables with placeholder values.

**CI/CD**: Secrets injected as environment variables, not from files.

---

## 12. CSRF Protection

Next.js App Router Route Handlers with cookie-based Supabase Auth benefit from:
- Supabase session validation (stateful, server-verified).
- For state-mutating endpoints, verify `Origin` header matches the application origin.

---

## 13. Dependency Security

- `npm audit` run before every release.
- Dependabot / `npm outdated` reviewed monthly.
- No packages with known critical CVEs are used in production.
