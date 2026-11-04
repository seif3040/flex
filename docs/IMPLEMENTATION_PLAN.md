# AI Workspace — Implementation Plan (Detailed)

**Version**: 2.0.0  
**Date**: 2026-11-04  
**Status**: Active

Each task has a unique ID, explicit dependencies, the exact files it creates or modifies, acceptance criteria, and verification commands. No task is started without an explicit instruction.

---

## Task ID Format

`P{phase:02d}-T{task:02d}` — e.g., `P01-T01` = Phase 1, Task 1.

---

# PHASE 01 — Project Scaffold & Configuration

**Goal**: A running, correctly configured Next.js 16 application with zero application logic.

---

## P01-T01 — Create Next.js Application

**Depends on**: Nothing  
**Estimated time**: 15 min

**What**:  
Bootstrap the Next.js application with the official CLI using TypeScript, App Router, Tailwind CSS, ESLint, and src directory layout.

**Exact command**:
```bash
cd d:\flex
npx create-next-app@16 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

**Files created by CLI** (key ones):
```
src/app/layout.tsx
src/app/page.tsx
src/app/globals.css
next.config.ts
tsconfig.json
tailwind.config.ts
postcss.config.mjs
package.json
.eslintrc.json
```

**Acceptance criteria**:
- [ ] `npm run dev` starts on port 3000 without errors
- [ ] Default Next.js page renders in browser
- [ ] TypeScript strict mode is ON (`"strict": true` in tsconfig.json)
- [ ] Tailwind CSS is working (a utility class changes visible styles)

**Verification**:
```bash
npm run dev        # Must start without error
npm run build      # Must succeed
npm run lint       # Must pass
npx tsc --noEmit   # Must pass
```

---

## P01-T02 — Configure TypeScript Strict Mode & Path Aliases

**Depends on**: P01-T01

**What**:  
Verify and strengthen `tsconfig.json` — ensure strict mode, `noUncheckedIndexedAccess`, and correct path aliases.

**Files modified**:
```
tsconfig.json
```

**Key tsconfig settings to verify/add**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Acceptance criteria**:
- [ ] `npx tsc --noEmit` passes with strict settings
- [ ] `@/` import alias resolves correctly

**Verification**:
```bash
npx tsc --noEmit
```

---

## P01-T03 — Initialize shadcn/ui

**Depends on**: P01-T01

**What**:  
Initialize shadcn/ui with the default theme and CSS variables. Install the Button, Input, Textarea, Dialog, DropdownMenu, Tooltip, Separator, Badge, Switch, and Label components needed in early phases.

**Exact commands**:
```bash
npx shadcn@latest init
npx shadcn@latest add button input textarea dialog dropdown-menu tooltip separator badge switch label scroll-area
```

**Files created**:
```
src/components/ui/button.tsx
src/components/ui/input.tsx
src/components/ui/textarea.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/tooltip.tsx
src/components/ui/separator.tsx
src/components/ui/badge.tsx
src/components/ui/switch.tsx
src/components/ui/label.tsx
src/components/ui/scroll-area.tsx
src/lib/utils.ts              (cn() helper)
components.json               (shadcn config)
```

**Acceptance criteria**:
- [ ] `import { Button } from "@/components/ui/button"` resolves without error
- [ ] A shadcn Button renders correctly in a test page
- [ ] `npx tsc --noEmit` still passes

**Verification**:
```bash
npx tsc --noEmit
npm run lint
```

---

## P01-T04 — Install Core Dependencies

**Depends on**: P01-T01

**What**:  
Install all production and dev dependencies needed across all phases.

**Production dependencies**:
```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  zod \
  react-markdown \
  remark-gfm \
  rehype-highlight \
  highlight.js \
  lucide-react \
  @monaco-editor/react \
  monaco-editor \
  file-type \
  pdf-parse \
  clsx \
  date-fns
```

**Dev dependencies**:
```bash
npm install -D \
  vitest \
  @vitejs/plugin-react \
  @vitest/coverage-v8 \
  @playwright/test \
  @types/pdf-parse \
  @testing-library/react \
  @testing-library/jest-dom \
  jsdom
```

**Files modified**:
```
package.json
package-lock.json (auto)
```

**Acceptance criteria**:
- [ ] All packages install without peer dependency conflicts
- [ ] `npm ls` shows no unmet peer dependencies
- [ ] `npx tsc --noEmit` still passes (new `@types/*` are compatible)

**Verification**:
```bash
npm ls 2>&1 | grep -i "UNMET\|ERR"   # Should be empty
npx tsc --noEmit
```

---

## P01-T05 — Configure Vitest

**Depends on**: P01-T04

**What**:  
Create `vitest.config.ts` with jsdom environment, path aliases, and coverage. Add npm scripts.

**Files created/modified**:
```
vitest.config.ts         (new)
vitest.setup.ts          (new)
package.json             (add scripts)
```

**`vitest.config.ts`** content shape:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    alias: { '@': path.resolve(__dirname, './src') }
  }
});
```

**npm scripts added**:
```json
"test": "vitest",
"test:coverage": "vitest run --coverage",
"test:run": "vitest run"
```

**Acceptance criteria**:
- [ ] `npm run test:run` runs (even with zero test files — no crash)
- [ ] A trivial unit test passes

**Verification**:
```bash
npm run test:run
```

---

## P01-T06 — Configure Playwright

**Depends on**: P01-T04

**What**:  
Create `playwright.config.ts`. Install Playwright browsers.

**Files created/modified**:
```
playwright.config.ts     (new)
tests/e2e/.gitkeep       (new)
package.json             (add script)
```

**npm script added**:
```json
"test:e2e": "playwright test"
```

**Exact command to install browsers**:
```bash
npx playwright install --with-deps chromium
```

**Acceptance criteria**:
- [ ] `npm run test:e2e` runs without fatal error (may have no test files yet)
- [ ] `playwright.config.ts` targets `http://localhost:3000`

**Verification**:
```bash
npx playwright --version
```

---

## P01-T07 — Create `.env.local.example` and `next.config.ts` Security Headers

**Depends on**: P01-T01

**What**:  
Create the environment variable template. Configure `next.config.ts` with security response headers.

**Files created/modified**:
```
.env.local.example       (new)
next.config.ts           (modified)
.gitignore               (verify .env.local is excluded)
```

**Security headers in `next.config.ts`**:
```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
];
```

**Acceptance criteria**:
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.local.example` exists with all required variable names
- [ ] `npm run build` passes with `next.config.ts` changes
- [ ] Security headers visible in `curl -I http://localhost:3000` response

**Verification**:
```bash
npm run build
grep "\.env\.local" .gitignore
```

---

## P01-T08 — Add `type-check` npm Script and Final Phase 01 Verification

**Depends on**: P01-T01 through P01-T07

**What**:  
Add `type-check` script. Run all checks and confirm Phase 01 is complete.

**Files modified**:
```
package.json
```

**Script added**:
```json
"type-check": "tsc --noEmit"
```

**Acceptance criteria** (all must pass):
- [ ] `npm run dev` — starts without error
- [ ] `npm run build` — builds successfully
- [ ] `npm run lint` — no errors
- [ ] `npm run type-check` — no TypeScript errors
- [ ] `npm run test:run` — no crashes
- [ ] shadcn/ui Button renders correctly on the home page

**Verification**:
```bash
npm run build && npm run lint && npm run type-check && npm run test:run
```

---

# PHASE 02 — Supabase Setup & Database Schema

**Goal**: All database tables created with RLS, type-safe client wrappers, and storage bucket configured.

**External requirement**: Supabase project credentials in `.env.local` (see EXTERNAL_CONFIG.md § 2.1)

---

## P02-T01 — Supabase Client Setup

**Depends on**: P01-T04, Supabase credentials in `.env.local`

**Files created**:
```
src/lib/supabase/client.ts       Browser client (anon key)
src/lib/supabase/server.ts       Server client (cookies, anon key)
src/lib/supabase/middleware.ts   Session refresh helper
src/types/database.ts            Placeholder (will be regenerated)
```

**Acceptance criteria**:
- [ ] Browser client initializes without error
- [ ] Server client reads cookies correctly in a Route Handler test
- [ ] `npx tsc --noEmit` passes

---

## P02-T02 — Database Migrations (Initial Schema)

**Depends on**: P02-T01

**Files created**:
```
supabase/migrations/20261104000001_initial_schema.sql
supabase/migrations/20261104000002_rls_policies.sql
supabase/migrations/20261104000003_storage_bucket.sql
supabase/migrations/20261104000004_triggers.sql
```

**Tables created**: `profiles`, `api_keys`, `projects`, `conversations`, `messages`, `files`, `artifacts`, `memory_entries`  
**Indexes**: On `messages(conversation_id, created_at)`, `conversations(user_id, updated_at)`, `messages(parent_id)`  
**RLS**: Enabled on all tables, `auth.uid() = user_id` policy for all operations  
**Trigger**: `handle_new_user()` creates a profile row on `auth.users` insert

**Verification**:
```bash
# Apply migrations to Supabase
npx supabase db push
# Or for local:
npx supabase db reset
```

---

## P02-T03 — Generate TypeScript Types from Schema

**Depends on**: P02-T02

**Files modified**:
```
src/types/database.ts    (auto-generated, do not edit manually)
```

**Command**:
```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

**Acceptance criteria**:
- [ ] `src/types/database.ts` contains all 8 tables
- [ ] `npx tsc --noEmit` passes with generated types

---

# PHASE 03 — Authentication

**Goal**: Users can sign up, log in, and log out. All protected routes redirect unauthenticated users.

---

## P03-T01 — Next.js Middleware (Route Guard)

**Depends on**: P02-T01

**Files created/modified**:
```
src/middleware.ts
```

**Logic**: If user visits any path under `/(dashboard)` or `/api/*` (except `/api/auth`) without a valid session, redirect to `/login`.

**Acceptance criteria**:
- [ ] Visiting `/` without session redirects to `/login`
- [ ] Auth API routes bypass the middleware guard
- [ ] Valid session passes through

**Verification**:
```bash
# Start dev server and visit http://localhost:3000 without being logged in
npm run dev
# Should redirect to /login
```

---

## P03-T02 — Login & Signup Pages

**Depends on**: P03-T01

**Files created**:
```
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(auth)/layout.tsx
src/app/auth/callback/route.ts
```

**Acceptance criteria**:
- [ ] User can create account with email/password
- [ ] User can log in with correct credentials
- [ ] Invalid credentials show an error message (not a crash)
- [ ] After login, user is redirected to dashboard
- [ ] After logout, user is redirected to `/login`

**Verification**:
```bash
npm run type-check
# Manual test: create account, login, logout
```

---

## P03-T03 — Authentication API Utility

**Depends on**: P02-T01

**Files created**:
```
src/lib/auth/session.ts    getServerSession() helper used in every API route
```

**Pattern**:
```typescript
// Every API route starts with:
const session = await getServerSession();
if (!session) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
```

**Acceptance criteria**:
- [ ] Helper returns null for unauthenticated requests
- [ ] Helper returns user object for authenticated requests
- [ ] Unit test covers both cases

**Verification**:
```bash
npm run test:run
npm run type-check
```

---

# PHASE 04 — Dashboard Shell & Sidebar Layout

**Goal**: Core UI chrome — sidebar, header, theme toggle, mobile responsiveness.

---

## P04-T01 — Root Layout with Theme Provider

**Depends on**: P03-T01, P01-T03

**Files created/modified**:
```
src/app/layout.tsx                (modify: add ThemeProvider)
src/components/providers/ThemeProvider.tsx
src/app/globals.css               (modify: CSS variables for light/dark)
```

**Acceptance criteria**:
- [ ] Light/dark toggle works
- [ ] System theme preference detected on first load
- [ ] Theme persists across page navigation

---

## P04-T02 — Dashboard Layout with Sidebar

**Depends on**: P04-T01

**Files created**:
```
src/app/(dashboard)/layout.tsx
src/components/sidebar/Sidebar.tsx
src/components/sidebar/ConversationList.tsx      (empty list placeholder)
src/components/sidebar/SidebarHeader.tsx
src/components/sidebar/UserMenu.tsx
```

**Acceptance criteria**:
- [ ] Sidebar shows on desktop (≥ 768px)
- [ ] Sidebar collapses to drawer on mobile (< 768px)
- [ ] Keyboard navigation: Sidebar items are focusable with Tab
- [ ] All routes under `(dashboard)` show the sidebar

**Verification**:
```bash
npm run build
npm run type-check
# Manually resize browser to verify mobile layout
```

---

## P04-T03 — Home Page and Settings Stub

**Depends on**: P04-T02

**Files created**:
```
src/app/(dashboard)/page.tsx               Home/new conversation page
src/app/(dashboard)/settings/page.tsx      Settings page (stub)
```

**Acceptance criteria**:
- [ ] Home page shows an empty state with "Start a new conversation" prompt
- [ ] Settings page renders without crashing
- [ ] Both pages pass TypeScript check

---

# PHASE 05 — API Key Management

**Goal**: Users can store, view (hint only), and delete their encrypted OpenRouter API key.

---

## P05-T01 — Key Encryption Library

**Depends on**: P01-T04

**Files created**:
```
src/lib/crypto/keys.ts
tests/unit/crypto/keys.test.ts
```

**Implementation**:
```typescript
// AES-256-GCM encrypt/decrypt using Node.js built-in crypto
// No external packages
export function encryptKey(plaintext: string): string { ... }
export function decryptKey(ciphertext: string): string { ... }
```

**Acceptance criteria**:
- [ ] `encryptKey(decryptKey(encrypted)) === original` round-trip test passes
- [ ] Different calls produce different ciphertext (IV randomness)
- [ ] Tampered ciphertext throws on decrypt (auth tag validation)
- [ ] Missing `KEY_ENCRYPTION_SECRET` env throws on module load (fail-fast)

**Verification**:
```bash
npm run test:run -- tests/unit/crypto/keys.test.ts
npm run type-check
```

---

## P05-T02 — API Key Routes

**Depends on**: P05-T01, P03-T03, P02-T02

**Files created**:
```
src/app/api/keys/route.ts        GET, POST, DELETE
src/schemas/keys.ts              Zod schemas
tests/unit/api/keys.test.ts
```

**Acceptance criteria**:
- [ ] `POST /api/keys` saves encrypted key (verify DB row is NOT plaintext)
- [ ] `GET /api/keys` returns only the hint (last 4 chars)
- [ ] `DELETE /api/keys` removes the row
- [ ] All routes return 401 without session
- [ ] RLS verified: user B cannot read user A's key

**Verification**:
```bash
npm run test:run -- tests/unit/api/keys.test.ts
npm run type-check
```

---

## P05-T03 — API Key Management UI

**Depends on**: P05-T02

**Files created**:
```
src/components/settings/ApiKeyManager.tsx
src/hooks/useApiKey.ts
```

**Acceptance criteria**:
- [ ] Settings page shows "No API key saved" or the key hint
- [ ] User can enter and save a key (shows hint after save)
- [ ] User can delete the key
- [ ] Input is type `password` (masked)
- [ ] Error shown if key format is invalid

---

# PHASE 06 — OpenRouter Model Listing

**Goal**: Fetch, normalize, cache, and display the live OpenRouter model list.

---

## P06-T01 — OpenRouter Types and Model Fetching

**Depends on**: P05-T01

**Files created**:
```
src/lib/openrouter/types.ts
src/lib/openrouter/models.ts
src/schemas/models.ts
tests/unit/openrouter/models.test.ts
```

**Key type**:
```typescript
interface NormalizedModel {
  id: string;
  name: string;
  contextWindow: number;
  pricing: { prompt: string; completion: string };
  isFree: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  description: string;
}
```

**Acceptance criteria**:
- [ ] Models are fetched from `https://openrouter.ai/api/v1/models`
- [ ] Free models correctly identified (`pricing.prompt === "0"`)
- [ ] Unknown fields in OpenRouter response do not crash (Zod `.passthrough()`)
- [ ] Unit test with mocked response validates normalization

**Verification**:
```bash
npm run test:run -- tests/unit/openrouter/models.test.ts
npm run type-check
```

---

## P06-T02 — `/api/models` Route with Caching

**Depends on**: P06-T01, P03-T03

**Files created**:
```
src/app/api/models/route.ts
```

**Cache**: In-memory Map keyed by user ID, 5-minute TTL.

**Acceptance criteria**:
- [ ] Returns 401 without session
- [ ] Returns model list with valid key
- [ ] Returns 502 if OpenRouter is unreachable or key is invalid
- [ ] `?free=true` returns only free models
- [ ] Second call within 5 min does not hit OpenRouter (verify via mock)

---

## P06-T03 — Model Selector Component

**Depends on**: P06-T02

**Files created**:
```
src/components/chat/ModelSelector.tsx
src/hooks/useModels.ts
```

**Acceptance criteria**:
- [ ] Shows model name, context window, and price per 1M tokens
- [ ] Free models have a "Free" badge
- [ ] Free-only toggle filters to free models only
- [ ] Selecting a model updates state correctly
- [ ] Loading and error states displayed

---

# PHASE 07 — Core Chat (New Conversation + Streaming)

**Goal**: The central feature. User sends a message, gets a streaming AI response, everything is persisted.

---

## P07-T01 — OpenRouter AI Gateway

**Depends on**: P06-T01

**Files created**:
```
src/lib/openrouter/gateway.ts
tests/unit/openrouter/gateway.test.ts
```

**Interface**:
```typescript
interface AIGateway {
  stream(params: StreamParams): Promise<ReadableStream>;
  complete(params: CompleteParams): Promise<CompletionResult>;
}
```

**Acceptance criteria**:
- [ ] Gateway streams tokens as they arrive from OpenRouter
- [ ] Gateway respects `modelId`, `messages`, and `apiKey` parameters
- [ ] Gateway does NOT log the API key
- [ ] Provider errors (401, 429, 5xx) are wrapped in typed errors

---

## P07-T02 — `/api/chat` SSE Streaming Route

**Depends on**: P07-T01, P05-T01, P03-T03, P02-T02

**Files created**:
```
src/app/api/chat/route.ts
src/schemas/chat.ts
```

**Acceptance criteria**:
- [ ] Returns 401 without session
- [ ] Returns 400 with invalid body (Zod validation)
- [ ] Returns 403 if conversation belongs to another user
- [ ] Streams tokens as `data: {"type":"chunk","content":"..."}` events
- [ ] Saves user message before streaming starts
- [ ] Saves assistant message after stream completes
- [ ] Updates `conversations.updated_at` after stream completes
- [ ] Returns error SSE event on provider error (not a 5xx crash)
- [ ] **Never** uses a paid model when model's `isFree` is false and conversation is free-only

---

## P07-T03 — `useChat` Hook

**Depends on**: P07-T02

**Files created**:
```
src/hooks/useChat.ts
tests/unit/hooks/useChat.test.ts
```

**State**:
```typescript
interface UseChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: ChatError | null;
  sendMessage: (content: string, options?: SendOptions) => Promise<void>;
  stopStreaming: () => void;
  regenerate: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
}
```

**Acceptance criteria**:
- [ ] Sending a message updates `messages` state incrementally
- [ ] `isStreaming` is true during stream, false after
- [ ] `stopStreaming` aborts the fetch
- [ ] Provider errors populate `error` state without crashing

---

## P07-T04 — Chat UI Components

**Depends on**: P07-T03

**Files created**:
```
src/app/(dashboard)/c/[id]/page.tsx
src/components/chat/ChatComposer.tsx
src/components/chat/MessageList.tsx
src/components/chat/MessageBubble.tsx
src/components/chat/StreamingMessage.tsx
src/components/chat/EmptyConversation.tsx
```

**Acceptance criteria**:
- [ ] New conversation page shows empty state
- [ ] User can type a message and press Send or Enter
- [ ] Tokens appear incrementally as they arrive
- [ ] Completed messages render markdown correctly (bold, code, tables)
- [ ] Code blocks have syntax highlighting and a copy button
- [ ] Error banner shown if chat fails
- [ ] Loading spinner while waiting for first token

**Verification**:
```bash
npm run build
npm run type-check
npm run lint
# Manual test: send a message and verify streaming
```

---

# PHASE 08 — Conversation History & Management

---

## P08-T01 — Conversation CRUD Routes

**Depends on**: P07-T02, P02-T02

**Files created**:
```
src/app/api/conversations/route.ts            GET (list), POST (create)
src/app/api/conversations/[id]/route.ts       GET, PATCH, DELETE
src/schemas/conversation.ts
tests/unit/api/conversations.test.ts
```

**Acceptance criteria**:
- [ ] List returns only user's conversations (RLS verified)
- [ ] Title search (`?q=`) filters correctly
- [ ] Rename updates title and returns updated object
- [ ] Delete cascades to messages (verified via DB query)
- [ ] Another user's conversation returns 403

---

## P08-T02 — Conversation List in Sidebar

**Depends on**: P08-T01

**Files created/modified**:
```
src/components/sidebar/ConversationList.tsx   (complete implementation)
src/hooks/useConversations.ts
```

**Acceptance criteria**:
- [ ] Sidebar shows all conversations, most recent first
- [ ] Search input filters conversations in real time
- [ ] Clicking a conversation navigates to `/c/[id]`
- [ ] Rename and delete via context menu
- [ ] New conversation appears immediately after creation

---

## P08-T03 — Auto-Title Generation

**Depends on**: P08-T01

**Files modified**:
```
src/app/api/chat/route.ts    (add auto-title after first message)
```

**Strategy**: After the first user message is sent, if the conversation title is "New Conversation", update it to the first 60 characters of the user message.

**Acceptance criteria**:
- [ ] New conversation is titled from first message content
- [ ] Title truncated to 60 chars with ellipsis
- [ ] Subsequent messages do not retitle

---

# PHASE 09 — Message Editing & Regeneration

---

## P09-T01 — Message Edit Route

**Depends on**: P08-T01

**Files created**:
```
src/app/api/messages/[id]/route.ts    PATCH
src/schemas/messages.ts
```

**Acceptance criteria**:
- [ ] Returns 401 without session, 403 if not owner
- [ ] Updates message content in DB
- [ ] Only `user` role messages can be edited (not `assistant`)

---

## P09-T02 — Edit and Regenerate UI

**Depends on**: P09-T01, P07-T03

**Files modified**:
```
src/components/chat/MessageBubble.tsx
src/hooks/useChat.ts
```

**Acceptance criteria**:
- [ ] Hovering a user message shows Edit button
- [ ] Edit opens inline text area with current content
- [ ] Saving edit updates message and triggers re-streaming
- [ ] Regenerate button appears on assistant messages
- [ ] Regenerating replaces the assistant message with new stream

---

# PHASE 10 — File Uploads & Document Analysis

---

## P10-T01 — File Validation Library

**Depends on**: P01-T04

**Files created**:
```
src/lib/files/validate.ts
tests/unit/files/validate.test.ts
```

**Validations**:
- Size ≤ 20 MB
- MIME by magic bytes: `application/pdf`, `text/plain`, `text/markdown`, `image/png`, `image/jpeg`, `image/webp`, `image/gif`
- Filename sanitization

**Acceptance criteria**:
- [ ] Oversized file throws `FileTooLargeError`
- [ ] Wrong MIME type throws `InvalidFileTypeError`
- [ ] Path traversal in filename is stripped

**Verification**:
```bash
npm run test:run -- tests/unit/files/validate.test.ts
```

---

## P10-T02 — Text Extraction Library

**Depends on**: P10-T01

**Files created**:
```
src/lib/files/extract.ts
tests/unit/files/extract.test.ts
```

**Supported**:
- PDF → `pdf-parse`
- Plain text / Markdown → direct read
- Images → pass through (vision models handle natively)

**Acceptance criteria**:
- [ ] PDF extraction returns text string
- [ ] Text extraction returns raw content
- [ ] Image files return null (not text-extracted)
- [ ] Corrupt PDF throws a typed error

---

## P10-T03 — File Upload Route

**Depends on**: P10-T01, P10-T02, P02-T02

**Files created**:
```
src/app/api/files/route.ts            POST
src/app/api/files/[id]/route.ts       GET, DELETE
src/schemas/files.ts
```

**Acceptance criteria**:
- [ ] File saved to Supabase Storage at `user-uploads/{userId}/{conversationId}/{filename}`
- [ ] DB row created with metadata
- [ ] Extracted text stored in `extracted_text` column
- [ ] Returns 400 for invalid file type/size
- [ ] Another user cannot access file (403)
- [ ] Delete removes from storage AND db

---

## P10-T04 — File Uploader Component + Chat Integration

**Depends on**: P10-T03, P07-T04

**Files created**:
```
src/components/files/FileUploader.tsx
src/components/files/AttachmentPreview.tsx
```

**Files modified**:
```
src/components/chat/ChatComposer.tsx    (add attachment button)
src/hooks/useChat.ts                   (include attachmentIds in send)
```

**Acceptance criteria**:
- [ ] Paperclip button opens file picker
- [ ] Selected file shown as preview chip above composer
- [ ] File uploaded on selection (not on send)
- [ ] Attachment IDs included in `/api/chat` request
- [ ] Extracted text injected into AI context

---

# PHASE 11 — Artifacts

---

## P11-T01 — Artifact Detection in AI Response

**Depends on**: P07-T04

**Files created**:
```
src/lib/artifacts/detect.ts
tests/unit/artifacts/detect.test.ts
```

**Logic**: Parse AI response for fenced code blocks (` ```language `). If a block is ≥ 20 lines or in an artifact-worthy language (tsx, jsx, html, python, etc.), flag as an artifact.

**Acceptance criteria**:
- [ ] Fenced code blocks are correctly detected
- [ ] Language is extracted from the fence opener
- [ ] Short snippets (< 20 lines) not flagged as artifacts

---

## P11-T02 — Artifact Panel with Monaco Editor

**Depends on**: P11-T01

**Files created**:
```
src/components/artifact/ArtifactPanel.tsx
src/components/artifact/CodeEditor.tsx       (Monaco with dynamic import, ssr:false)
src/components/artifact/ArtifactToolbar.tsx
src/app/api/artifacts/[id]/route.ts          GET, PATCH
src/schemas/artifacts.ts
src/hooks/useArtifacts.ts
```

**Acceptance criteria**:
- [ ] Artifact panel slides in from the right when an artifact is detected
- [ ] Monaco Editor loads (dynamic import, no SSR error)
- [ ] User can edit code in Monaco
- [ ] Save creates a new version (new DB row with `parent_id`)
- [ ] Download button exports file with correct extension
- [ ] `npx tsc --noEmit` passes (Monaco types correct)

---

## P11-T03 — Sandboxed Artifact Preview

**Depends on**: P11-T02

**Files created**:
```
src/components/artifact/ArtifactPreview.tsx
```

**Iframe attributes** (non-negotiable):
```html
<iframe
  sandbox="allow-scripts"
  srcDoc={artifactHtml}
  referrerPolicy="no-referrer"
  ...
/>
```

**No `allow-same-origin`** — this is what prevents cookie/localStorage access.

**Acceptance criteria**:
- [ ] HTML artifacts render in the preview panel
- [ ] `document.cookie` inside iframe returns empty string (verify via console in iframe)
- [ ] `window.parent.location` throws SecurityError in iframe
- [ ] Non-HTML artifacts show "Preview not available" message

---

# PHASE 12 — Voice Phase A

---

## P12-T01 — Speech Recognition Library

**Depends on**: P01-T04

**Files created**:
```
src/lib/voice/speech-recognition.ts
```

**Acceptance criteria**:
- [ ] Returns `isSpeechRecognitionSupported` boolean correctly
- [ ] Wraps `webkitSpeechRecognition` and `SpeechRecognition` uniformly
- [ ] Exposes typed error codes

---

## P12-T02 — Speech Synthesis Library

**Depends on**: P01-T04

**Files created**:
```
src/lib/voice/speech-synthesis.ts
```

**Acceptance criteria**:
- [ ] `speakText()` strips markdown before speaking
- [ ] `stopSpeaking()` cancels current speech
- [ ] No error thrown if `speechSynthesis` not supported

---

## P12-T03 — Dictation Button Component

**Depends on**: P12-T01, P12-T02

**Files created**:
```
src/components/voice/DictationButton.tsx
src/hooks/useVoice.ts
```

**Files modified**:
```
src/components/chat/ChatComposer.tsx    (add DictationButton)
```

**Acceptance criteria**:
- [ ] Button disabled with tooltip on unsupported browsers
- [ ] Permission requested only on click (not on load)
- [ ] Pulsing red indicator while recording
- [ ] Interim transcript shown in composer
- [ ] Final transcript sets composer text
- [ ] All error states have user-visible messages

---

# PHASES 13-20 — Summary Specs

The following phases are fully specified in IMPLEMENTATION_PLAN.md but their task breakdowns will be detailed when each phase is authorized. High-level acceptance criteria:

---

## Phase 13 — Web Search with Citations

**Key tasks**:
- `P13-T01`: Web search provider abstraction (`src/lib/search/`)
- `P13-T02`: `/api/search` route (SSRF-protected)
- `P13-T03`: OpenRouter tool-call integration in gateway
- `P13-T04`: Citation rendering in `MessageBubble`

**Verification**: Send a message with search enabled → response contains inline links with accessible URLs.

---

## Phase 14 — Projects

**Key tasks**:
- `P14-T01`: Project CRUD routes (`/api/projects`)
- `P14-T02`: Project pages in dashboard
- `P14-T03`: System prompt injection in `/api/chat`

---

## Phase 15 — User Memory

**Key tasks**:
- `P15-T01`: Memory CRUD routes (`/api/memory`)
- `P15-T02`: Memory settings UI
- `P15-T03`: Memory injection in chat context builder

---

## Phase 16 — Voice Phase B (Turn-Based)

**Key tasks**:
- `P16-T01`: `VoiceChat.tsx` component with state machine
- `P16-T02`: STT → LLM → TTS pipeline coordination
- `P16-T03`: Transcript display and controls

---

## Phase 17 — Conversation Branching

**Key tasks**:
- `P17-T01`: `parent_id` chain support in message loading
- `P17-T02`: Branch creation from any message
- `P17-T03`: Branch navigation UI

---

## Phase 18 — Hardening

**Key tasks**:
- `P18-T01`: In-memory rate limiter with per-route limits
- `P18-T02`: Full Content Security Policy in `next.config.ts`
- `P18-T03`: `npm audit` — resolve all critical/high CVEs
- `P18-T04`: Security headers verification

**Verification**:
```bash
npm audit --audit-level=high
# Should report 0 vulnerabilities
```

---

## Phase 19 — Testing

**Key tasks**:
- `P19-T01`: Vitest unit tests — coverage ≥ 70% for `lib/` modules
- `P19-T02`: Playwright E2E — auth flow, send message, file upload, artifact preview
- `P19-T03`: CI configuration (GitHub Actions or equivalent)

**Verification**:
```bash
npm run test:coverage   # Coverage report
npm run test:e2e        # All E2E tests pass
```

---

## Phase 20 — Polish

**Key tasks**:
- `P20-T01`: Lighthouse audit (target ≥ 90 all categories)
- `P20-T02`: Keyboard navigation audit
- `P20-T03`: `robots.txt`, `manifest.json`

---

# Task Dependency Graph

```
P01-T01 → P01-T02, P01-T03, P01-T04, P01-T07
P01-T04 → P01-T05, P01-T06
P01-T01..T08 → P02-T01
P02-T01 → P02-T02 → P02-T03
P02-T01 + P03 → P05
P05 + P06 → P07
P07 → P08 → P09
P07 → P10
P07 → P11
P07 → P12
P07 → P13
P08 → P14
P07 → P15
P12 → P16
P09 → P17
P01..P17 → P18 → P19 → P20
```
