# AI Workspace — Open Questions & Unresolved Decisions

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

Questions that require a decision before the affected phase can begin.  
Answers will be recorded here and reflected in DECISIONS.md.

---

## Q-001 — Supabase Deployment Mode

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 02  
**Question**: Should the Supabase backend run locally (requires Docker Desktop) or use Supabase Cloud?

**Implications**:
- Local: Faster iteration, no network; requires Docker Desktop installed and running.
- Cloud: No Docker needed; requires creating a Supabase project online; migration applies via CLI to remote.

**Default if not answered**: Assume Supabase Cloud (broader compatibility).

---

## Q-002 — Email Confirmation in Auth

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 03  
**Question**: Should email confirmation be required for new user accounts?

**Implications**:
- Enabled: More secure for production; slower to test locally.
- Disabled: Instant account creation; suitable for development.

**Default if not answered**: Disabled in development (`.env.local`), enabled guidance for production.

---

## Q-003 — Web Search Provider

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 13  
**Question**: Which web search backend should the app use?

**Options**:
1. `openrouter-tools` — Use OpenRouter model tool calling for search (no extra account; model must support tools)
2. `brave` — Brave Search API (2000 free req/month)
3. `serper` — Serper.dev (100 free req/month, Google results)
4. `tavily` — Tavily AI search (1000 free req/month, AI-optimized)

**Default if not answered**: `openrouter-tools` (zero extra infrastructure for MVP).

---

## Q-004 — Artifact Preview Subdomain

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 11  
**Question**: Should artifact previews be isolated on a separate subdomain in development, or is `sandbox="allow-scripts"` on an iframe sufficient for MVP?

**Implications**:
- Iframe with `sandbox="allow-scripts"` (no `allow-same-origin`): Provides JS isolation but not full browser-level cookie isolation. Acceptable for MVP.
- Separate subdomain (`preview.localhost:3001`): Full browser-level isolation. More complex setup.

**Default if not answered**: `sandbox="allow-scripts"` iframe for MVP. Subdomain note added to production deployment checklist.

---

## Q-005 — Free Model Enforcement Level

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 07  
**Question**: When a user enables "Free Only" mode, should the enforcement be:

A. **UI-only**: The model selector only shows free models; server trusts the client's model selection.  
B. **Server-enforced**: The API route cross-checks the selected model against OpenRouter's pricing and rejects the request if the model is not free.

**Implications**:
- UI-only: Simpler; a motivated user could bypass by crafting a request.
- Server-enforced: Stronger contract; requires fetching model data server-side per request (adds latency) or caching it.

**Default if not answered**: Server-enforced (consistent with the security-first approach stated in engineering instructions).

---

## Q-006 — Rate Limiting Backend

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 18 (but affects Phase 07 design)  
**Question**: Should rate limiting use in-memory storage (simple, resets on restart, fails with multiple instances) or Redis/Upstash (persistent, multi-instance)?

**Implications**:
- In-memory: Fine for single-instance dev/MVP; not production-safe with horizontal scaling.
- Upstash Redis: Free tier available; production-ready; requires account setup.

**Default if not answered**: In-memory for MVP with a clear TODO comment to migrate to Redis before scaling.

---

## Q-007 — Conversation Auto-Title Strategy

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 08  
**Question**: How should conversations be automatically titled?

**Options**:
A. **Client-side truncation**: Use the first N characters of the user's first message.  
B. **LLM summarization**: Make a cheap LLM call (e.g., free model) to generate a title from the first exchange.

**Implications**:
- Client-side: Instant, free, but titles are often not descriptive.
- LLM: Better titles, adds latency, consumes API credits (even if tiny).

**Default if not answered**: Client-side truncation for MVP (first 50 chars of first user message). LLM summarization as a Phase 08 enhancement option.

---

## Q-008 — Mobile Voice Chat (Phase B)

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 16  
**Question**: Should voice chat (Phase B, turn-based) be supported on iOS Safari?

**Implications**:
- iOS Safari has limited `SpeechRecognition` support and may require HTTPS.
- Supporting it adds complexity to testing and fallback paths.

**Default if not answered**: Target Chrome/Edge primarily for Phase B voice; note iOS Safari as best-effort.

---

## Q-009 — Maximum Context Window Handling

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 07  
**Question**: When conversation history exceeds the model's context window, what strategy should be used?

**Options**:
A. **Hard truncation**: Drop oldest messages until it fits (simple, may lose context).  
B. **Summary compression**: Use a cheap LLM call to summarize older messages (better UX, adds latency/cost).  
C. **User-visible warning**: Warn the user that history is too long, let them decide.  
D. **Sliding window**: Always include system prompt + last N messages.

**Default if not answered**: Sliding window (Option D) for MVP — always include system + last 20 messages + user's current message. Add a UI warning when truncation occurs.

---

## Q-010 — Monorepo or Standalone

**Status**: Resolved ✅  
**Decision**: Single Next.js project. No monorepo needed for MVP scope.  
**Recorded in**: DECISIONS.md (implicit in D-001).

---

## Q-011 — SSR vs CSR for Conversation Page

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 07  
**Question**: Should the conversation page `/c/[id]` use Server Components to load the initial message history (SSR), or load messages client-side after mount?

**Options**:
A. **RSC (Server Components)**: Initial message list loaded on server; faster first paint; needs careful streaming/Suspense setup.  
B. **Client-side fetch**: Page shell loads, then fetches messages via `useEffect`; simpler but shows loading spinner.

**Default if not answered**: RSC with Suspense for initial message load, then client-side appends for new streaming messages.

---

## Q-012 — PDF Text Extraction Library

**Status**: ⏳ Awaiting answer  
**Needed before**: Phase 10  
**Question**: Which library should extract text from PDFs?

**Options**:
A. `pdf-parse` — Pure JS, simple, no native deps. Known issue with some scanned PDFs.  
B. `pdfjs-dist` (PDF.js) — Mozilla's library, broader compatibility, larger bundle.  
C. External API — Send PDF to an external extraction service.

**Default if not answered**: `pdf-parse` for MVP (simplest, no native binaries required).

---

## Unresolved Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenRouter model list schema changes | Model selector breaks | Normalize with Zod, handle unknown fields gracefully |
| Browser blocks SSE POST on some proxies | Chat doesn't stream | Implement polling fallback if SSE fails |
| Safari SpeechRecognition reliability | Dictation broken on Safari | Feature-detect and test; show browser recommendation |
| Monaco Editor SSR | Build fails | Use `dynamic(() => import(...), { ssr: false })` |
| Supabase free tier limits (500 MB DB, 1 GB storage) | Hits limits in testing | Monitor; note limits in deployment docs |
| `pdf-parse` test file conflict | Vitest crashes | Use `vitest --exclude` for pdf-parse internals |
