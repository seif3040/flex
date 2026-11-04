# AI Workspace — Decisions Log

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

Record every significant architectural or technology decision here with reasoning and alternatives considered.

---

## D-001: Next.js App Router over Pages Router

**Date**: 2026-11-04  
**Decision**: Use Next.js 16 App Router.  
**Reasoning**: App Router supports React Server Components, nested layouts, streaming, and SSE via Route Handlers natively. It is the current default and long-term direction.  
**Alternatives**: Pages Router — older, lacks RSC and native SSE support.

---

## D-002: Supabase for Auth + DB + Storage

**Date**: 2026-11-04  
**Decision**: Supabase as the unified backend.  
**Reasoning**: Provides Auth, PostgreSQL with RLS, Storage, and real-time — all in one managed platform. Reduces operational burden for MVP. TypeScript client is well-supported.  
**Alternatives**: Firebase (less SQL control), Auth0 + Neon + S3 (more complexity).

---

## D-003: OpenRouter as AI Provider Gateway

**Date**: 2026-11-04  
**Decision**: OpenRouter as the single AI provider gateway with BYOK.  
**Reasoning**: Aggregates many models under a single API, supports streaming, enables free-model filtering. BYOK eliminates billing complexity.  
**Alternatives**: Direct OpenAI/Anthropic SDKs (requires multiple integrations, no free-model aggregation).

---

## D-004: AES-256-GCM for API Key Encryption

**Date**: 2026-11-04  
**Decision**: Encrypt user OpenRouter keys with AES-256-GCM before storing in DB.  
**Reasoning**: Authenticated encryption prevents both confidentiality and integrity attacks. Key stored in env var, not DB. Node.js `crypto` module handles this natively without additional packages.  
**Alternatives**: bcrypt (one-way, can't decrypt for use), envelope encryption with KMS (more complex, adds cost).

---

## D-005: SSE over WebSockets for Chat Streaming

**Date**: 2026-11-04  
**Decision**: Use Server-Sent Events (SSE) for chat streaming.  
**Reasoning**: SSE is unidirectional (server → client), which is exactly what AI token streaming needs. No WebSocket infrastructure required. Supported natively in Next.js Route Handlers via `ReadableStream`. Simpler to implement and debug.  
**Alternatives**: WebSockets (bidirectional, more complex, requires separate WS server or adapter).

---

## D-006: shadcn/ui as Component System

**Date**: 2026-11-04  
**Decision**: Use shadcn/ui with Tailwind CSS.  
**Reasoning**: shadcn/ui components are copy-owned (not a node_modules black box), highly customizable, Radix UI-based for accessibility, and pair naturally with Tailwind. Industry standard for Next.js apps.  
**Alternatives**: MUI (heavy, opinionated), Mantine (less control), Chakra UI (less Tailwind synergy).

---

## D-007: Monaco Editor for Artifact Code Editing

**Date**: 2026-11-04  
**Decision**: Monaco Editor for code artifact editing.  
**Reasoning**: The same editor that powers VS Code. Rich syntax highlighting, language support, keyboard shortcuts. Well-maintained `@monaco-editor/react` wrapper.  
**Alternatives**: CodeMirror 6 (lighter, good alternative but less familiar to VS Code users).

---

## D-008: Sandboxed iframe for Artifact Preview

**Date**: 2026-11-04  
**Decision**: Render artifact HTML/JS previews in a sandboxed `<iframe sandbox="allow-scripts">`.  
**Reasoning**: `allow-scripts` without `allow-same-origin` prevents the iframe from accessing parent frame, cookies, or localStorage. This is the minimum viable isolation without a separate server.  
**Production note**: In production, serve preview from a separate subdomain to enforce browser-level cookie isolation.  
**Alternatives**: Worker-based sandboxing (more complex), CSP only (insufficient isolation).

---

## D-009: Zod for All API Validation

**Date**: 2026-11-04  
**Decision**: Use Zod for all API request/response validation.  
**Reasoning**: TypeScript-first, composable, integrates well with form libraries and tRPC if needed later. Provides runtime type safety that TypeScript cannot.  
**Alternatives**: Yup (less TS-native), io-ts (more complex), class-validator (requires decorators).

---

## D-010: One OpenRouter Key per User (MVP)

**Date**: 2026-11-04  
**Decision**: Support exactly one API key per user in MVP.  
**Reasoning**: Simplifies the key management UI and DB schema. Users rarely need multiple keys. Can be extended to multiple labeled keys later.  
**Alternatives**: Multiple keys — adds UI/UX complexity for limited MVP benefit.
