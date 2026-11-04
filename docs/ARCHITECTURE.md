# AI Workspace — Architecture Document

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.x |
| Language | TypeScript (strict) | 5.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | latest |
| Auth | Supabase Auth | latest |
| Database | Supabase PostgreSQL | 15.x |
| Storage | Supabase Storage | latest |
| AI Provider | OpenRouter API | REST |
| Validation | Zod | 3.x |
| Streaming | Server-Sent Events (SSE) | native |
| Code Editor | Monaco Editor | latest |
| Unit Tests | Vitest | latest |
| E2E Tests | Playwright | latest |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Chat UI  │  │ Artifact │  │  Voice   │  │ Settings  │  │
│  │Components │  │  Panel   │  │  UI      │  │   Page    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       └─────────────┴─────────────┴───────────────┘        │
│                           │                                  │
│                    Next.js App Router                        │
│                 (React Server Components)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                     Next.js API Routes                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  /api/chat │  │/api/files  │  │/api/models │             │
│  │ (SSE/POST) │  │            │  │            │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
│        │               │               │                     │
│  ┌─────▼───────────────▼───────────────▼──────┐             │
│  │            Service Layer                     │             │
│  │  AIGateway │ FileService │ MemoryService    │             │
│  │  SearchSvc │ ArtifactSvc │ ConversationSvc  │             │
│  └─────┬──────────────────────────────────────┘             │
│        │                                                      │
└────────┼─────────────────────────────────────────────────────┘
         │
    ┌────┴──────────────────────────┐
    │                               │
┌───▼────────┐              ┌───────▼──────────┐
│  OpenRouter │              │  Supabase        │
│  API        │              │  ┌────────────┐  │
│  (AI + STT) │              │  │ PostgreSQL  │  │
└────────────┘              │  ├────────────┤  │
                             │  │  Storage   │  │
                             │  ├────────────┤  │
                             │  │   Auth     │  │
                             │  └────────────┘  │
                             └──────────────────┘
```

---

## 3. Directory Structure

```
d:\flex\
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/            # Protected route group
│   │   │   ├── layout.tsx          # Dashboard shell with sidebar
│   │   │   ├── page.tsx            # Home / new conversation
│   │   │   ├── c/[id]/             # Conversation view
│   │   │   ├── projects/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── chat/route.ts       # SSE streaming endpoint
│   │   │   ├── conversations/      # CRUD conversations
│   │   │   ├── messages/           # CRUD messages
│   │   │   ├── models/route.ts     # Proxy OpenRouter model list
│   │   │   ├── files/route.ts      # Upload / fetch files
│   │   │   ├── keys/route.ts       # Encrypted key management
│   │   │   ├── search/route.ts     # Web search
│   │   │   ├── memory/             # User memory CRUD
│   │   │   └── projects/           # Project CRUD
│   │   ├── artifact-preview/       # Sandboxed preview page (isolated origin)
│   │   └── layout.tsx              # Root layout (theme provider)
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── chat/                   # Chat-specific components
│   │   │   ├── ChatComposer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── StreamingMessage.tsx
│   │   │   └── ModelSelector.tsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── ConversationList.tsx
│   │   ├── artifact/
│   │   │   ├── ArtifactPanel.tsx
│   │   │   ├── CodeEditor.tsx      # Monaco wrapper
│   │   │   └── ArtifactPreview.tsx # sandboxed iframe
│   │   ├── voice/
│   │   │   ├── DictationButton.tsx
│   │   │   └── VoiceChat.tsx
│   │   ├── files/
│   │   │   └── FileUploader.tsx
│   │   └── settings/
│   │       ├── ApiKeyManager.tsx
│   │       └── MemoryManager.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server Supabase client (cookies)
│   │   │   └── middleware.ts       # Auth middleware helpers
│   │   ├── openrouter/
│   │   │   ├── gateway.ts          # Centralized AI gateway
│   │   │   ├── models.ts           # Model list fetching & caching
│   │   │   └── types.ts            # OpenRouter type definitions
│   │   ├── crypto/
│   │   │   └── keys.ts             # AES-GCM key encryption/decryption
│   │   ├── files/
│   │   │   ├── upload.ts           # Validated upload helpers
│   │   │   └── extract.ts          # Text extraction from files
│   │   ├── voice/
│   │   │   ├── speech-recognition.ts
│   │   │   └── speech-synthesis.ts
│   │   ├── search/
│   │   │   └── web-search.ts
│   │   ├── memory/
│   │   │   └── memory-service.ts
│   │   └── utils.ts                # Shared utilities
│   │
│   ├── hooks/
│   │   ├── useChat.ts              # Chat state machine
│   │   ├── useConversations.ts
│   │   ├── useModels.ts
│   │   ├── useVoice.ts
│   │   └── useArtifacts.ts
│   │
│   ├── schemas/
│   │   ├── chat.ts                 # Zod schemas for chat API
│   │   ├── conversation.ts
│   │   ├── files.ts
│   │   ├── models.ts
│   │   ├── keys.ts
│   │   └── memory.ts
│   │
│   ├── types/
│   │   ├── database.ts             # Supabase generated types
│   │   └── global.d.ts
│   │
│   └── middleware.ts               # Next.js edge middleware (auth guard)
│
├── supabase/
│   ├── migrations/                 # SQL migration files
│   └── seed.sql
│
├── tests/
│   ├── unit/                       # Vitest unit tests
│   └── e2e/                        # Playwright E2E tests
│
├── docs/                           # This documentation
├── public/
├── .env.local.example              # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Data Flow — Chat Request

```
User types message
       │
       ▼
ChatComposer.tsx
  → POST /api/chat (with conversationId, message, modelId)
       │
       ▼
/api/chat/route.ts
  1. Validate session (Supabase)
  2. Validate request (Zod)
  3. Verify conversation ownership (RLS / explicit check)
  4. Decrypt user's OpenRouter key (AES-GCM)
  5. Build messages array (history + system prompt + memory)
  6. Call AIGateway.stream()
  7. Return ReadableStream (SSE)
       │
       ▼
AIGateway (lib/openrouter/gateway.ts)
  → fetch OpenRouter /chat/completions (stream: true)
  → Forward SSE chunks to client
       │
       ▼
Client: StreamingMessage.tsx
  → Accumulates tokens
  → Renders markdown incrementally
  → On completion: save message to DB
```

---

## 5. Security Architecture

See `SECURITY.md` for the full security model.

Key points:
- All API routes require a valid Supabase session cookie.
- OpenRouter keys are encrypted at rest (AES-256-GCM) with a secret from env.
- RLS policies ensure users can only access their own rows.
- Artifact previews run in a sandboxed `<iframe>` with `sandbox` attribute and no shared cookies.
- File uploads are validated by MIME type (magic bytes) and capped at 20 MB.

---

## 6. Streaming Protocol

Chat uses Server-Sent Events (SSE) over HTTP POST via the `ReadableStream` API in Next.js Route Handlers:

```
Client → POST /api/chat
Server → Content-Type: text/event-stream
         data: {"type":"chunk","content":"Hello"}\n\n
         data: {"type":"chunk","content":" world"}\n\n
         data: {"type":"done","messageId":"uuid"}\n\n
         data: [DONE]\n\n
```

---

## 7. API Key Encryption

User OpenRouter keys are encrypted before storage using AES-256-GCM:

```
Encryption secret: process.env.KEY_ENCRYPTION_SECRET (32 bytes, hex)
Algorithm: AES-256-GCM
IV: 12 random bytes, stored alongside ciphertext
Format stored: base64(iv + authTag + ciphertext)
```

The encryption secret is never stored in the database. It is set as a server-only environment variable.
