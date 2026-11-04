# AI Workspace — API Contracts

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

All private API routes require a valid Supabase session cookie. All request bodies are validated with Zod. All responses follow the envelope format below unless noted.

---

## 0. Response Envelope

### Success
```json
{ "data": <payload> }
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | PROVIDER_ERROR | INTERNAL_ERROR",
    "message": "Human-readable description",
    "details": {}      // optional — Zod field errors, provider messages
  }
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE success) |
| 400 | Validation failure |
| 401 | No valid session |
| 403 | Resource owned by another user |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 502 | Upstream provider error |
| 500 | Internal server error |

---

## 1. Auth — Managed by Supabase

Supabase handles `/auth/v1/*` natively. The app wraps:

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/callback` | GET | OAuth / magic-link redirect handler |

---

## 2. API Keys

### `POST /api/keys`
Save or replace the user's OpenRouter API key.

**Auth**: Required  
**Rate limit**: 10 / user / hour

**Request body**:
```json
{
  "key": "sk-or-v1-..."    // string, min 20 chars, starts with "sk-or"
}
```

**Zod schema**:
```typescript
z.object({
  key: z.string().min(20).startsWith("sk-or")
})
```

**Success `201`**:
```json
{ "data": { "hint": "...abcd", "label": "Default" } }
```

**Errors**: 400 (validation), 401, 429

---

### `GET /api/keys`
Return key metadata only. Never returns the raw or encrypted key.

**Auth**: Required

**Success `200`**:
```json
{ "data": { "hint": "...abcd", "label": "Default", "createdAt": "2026-11-04T..." } }
```

**No key saved → `200`**:
```json
{ "data": null }
```

---

### `DELETE /api/keys`
Delete the saved key.

**Auth**: Required

**Success `204`**: No body.

---

## 3. Models

### `GET /api/models`
Return normalized model list from OpenRouter. Requires a saved API key.

**Auth**: Required  
**Cache**: 5-minute server-side cache per user (key-scoped)  
**Rate limit**: Effectively cached; 1 upstream call / 5 min

**Query params**:
```
?free=true      // Filter to models with pricing.prompt === "0" AND pricing.completion === "0"
```

**Success `200`**:
```json
{
  "data": {
    "models": [
      {
        "id": "openai/gpt-4o",
        "name": "GPT-4o",
        "contextWindow": 128000,
        "pricing": {
          "prompt": "0.000005",
          "completion": "0.000015"
        },
        "isFree": false,
        "supportsVision": true,
        "supportsTools": true,
        "description": "..."
      }
    ],
    "cachedAt": "2026-11-04T..."
  }
}
```

**Errors**: 401, 502 (OpenRouter unreachable or invalid key)

---

## 4. Conversations

### `GET /api/conversations`
List the user's conversations, most recent first.

**Auth**: Required

**Query params**:
```
?q=search_term     // optional title search
?projectId=uuid    // optional project filter
?limit=50          // default 50, max 100
?cursor=uuid       // pagination cursor (last id from previous page)
```

**Success `200`**:
```json
{
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "title": "My conversation",
        "modelId": "openai/gpt-4o",
        "projectId": null,
        "createdAt": "...",
        "updatedAt": "...",
        "messageCount": 12
      }
    ],
    "nextCursor": "uuid | null"
  }
}
```

---

### `POST /api/conversations`
Create a new conversation.

**Auth**: Required

**Request body**:
```json
{
  "title": "New Conversation",    // optional, default "New Conversation"
  "modelId": "openai/gpt-4o",     // required
  "projectId": "uuid",            // optional
  "systemPrompt": "You are..."    // optional
}
```

**Zod schema**:
```typescript
z.object({
  title: z.string().max(255).optional(),
  modelId: z.string().min(1).max(200),
  projectId: z.string().uuid().optional(),
  systemPrompt: z.string().max(10000).optional()
})
```

**Success `201`**:
```json
{ "data": { "id": "uuid", "title": "New Conversation", ... } }
```

---

### `GET /api/conversations/[id]`
Get a conversation with its messages.

**Auth**: Required

**Success `200`**:
```json
{
  "data": {
    "conversation": { "id": "uuid", "title": "...", "modelId": "...", ... },
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hello",
        "metadata": {},
        "createdAt": "..."
      }
    ]
  }
}
```

**Errors**: 401, 403, 404

---

### `PATCH /api/conversations/[id]`
Rename or update a conversation.

**Auth**: Required

**Request body** (all fields optional, at least one required):
```json
{
  "title": "New title",
  "modelId": "anthropic/claude-3-5-sonnet",
  "systemPrompt": "..."
}
```

**Success `200`**: Updated conversation object.

---

### `DELETE /api/conversations/[id]`
Delete conversation and all its messages (cascaded by DB).

**Auth**: Required  
**Success `204`**: No body.

---

## 5. Messages

### `PATCH /api/messages/[id]`
Edit a user message's content.

**Auth**: Required  
**Ownership check**: Message's `user_id` must match session user.

**Request body**:
```json
{ "content": "Updated message text" }
```

**Zod schema**:
```typescript
z.object({ content: z.string().min(1).max(100000) })
```

**Success `200`**: Updated message object.

---

## 6. Chat (Streaming)

### `POST /api/chat`
Send a message and receive a streaming AI response via Server-Sent Events.

**Auth**: Required  
**Rate limit**: 60 / user / minute  
**Content-Type response**: `text/event-stream`

**Request body**:
```json
{
  "conversationId": "uuid",        // required — conversation must exist and be owned by user
  "content": "User message text",  // required
  "modelId": "openai/gpt-4o",      // required — must match conversation model or be valid override
  "attachmentIds": ["uuid"],       // optional — file IDs already uploaded
  "useMemory": true,               // optional — inject user memory
  "useWebSearch": false            // optional — enable web search tool
}
```

**Zod schema**:
```typescript
z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(100000),
  modelId: z.string().min(1).max(200),
  attachmentIds: z.array(z.string().uuid()).max(10).optional(),
  useMemory: z.boolean().optional().default(false),
  useWebSearch: z.boolean().optional().default(false)
})
```

**SSE event stream**:
```
data: {"type":"start","messageId":"uuid","model":"openai/gpt-4o"}\n\n
data: {"type":"chunk","content":"Hello"}\n\n
data: {"type":"chunk","content":" world"}\n\n
data: {"type":"citation","url":"https://...","title":"Source"}\n\n
data: {"type":"done","messageId":"uuid","finishReason":"stop","tokenCount":42}\n\n
data: [DONE]\n\n
```

**Error events** (before stream closes):
```
data: {"type":"error","code":"PROVIDER_ERROR","message":"Rate limit exceeded"}\n\n
data: [DONE]\n\n
```

**Server-side logic order**:
1. Verify session → 401 if missing
2. Validate body with Zod → 400 if invalid
3. Verify conversation ownership → 403 if mismatch
4. Verify modelId is not paid when conversation is free-only → 400 if violated
5. Decrypt user's OpenRouter key → 503 if no key saved
6. Build messages array: system + memory + history + attachments + user message
7. Save user message to DB
8. Call `AIGateway.stream()` → begin SSE
9. On stream complete: save assistant message to DB, update conversation `updated_at`

---

## 7. Files

### `POST /api/files`
Upload a file. Returns file metadata and triggers text extraction.

**Auth**: Required  
**Rate limit**: 20 / user / hour  
**Content-Type**: `multipart/form-data`

**Form fields**:
```
file         File object (required)
conversationId  UUID (optional)
projectId       UUID (optional)
```

**Validations** (server-side, never trust client headers):
- Size ≤ 20 MB
- MIME type verified by magic bytes (not extension): PDF, TXT, MD, PNG, JPEG, WebP, GIF
- Filename sanitized (alphanumeric, dash, underscore, dot only)

**Success `201`**:
```json
{
  "data": {
    "id": "uuid",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 102400,
    "extractedText": "First 500 chars...",  // null if extraction pending
    "createdAt": "..."
  }
}
```

**Errors**: 400 (type/size invalid), 401, 429

---

### `GET /api/files/[id]`
Get file metadata. Does not return file content (use signed Supabase Storage URL).

**Auth**: Required

**Success `200`**: File metadata object.

---

### `DELETE /api/files/[id]`
Delete file from storage and DB.

**Auth**: Required  
**Success `204`**: No body.

---

## 8. Artifacts

### `GET /api/artifacts/[id]`
Get artifact content.

**Auth**: Required

**Success `200`**:
```json
{
  "data": {
    "id": "uuid",
    "title": "My Component",
    "language": "tsx",
    "content": "export default function...",
    "version": 1,
    "createdAt": "..."
  }
}
```

---

### `PATCH /api/artifacts/[id]`
Save a new version of an artifact (creates new DB row with `parent_id`).

**Auth**: Required

**Request body**:
```json
{
  "content": "Updated code...",
  "title": "My Component v2"      // optional
}
```

**Success `200`**: New artifact version object.

---

## 9. Memory

### `GET /api/memory`
List user's memory entries.

**Auth**: Required

**Success `200`**:
```json
{ "data": { "entries": [{ "id": "uuid", "content": "...", "isActive": true }] } }
```

---

### `POST /api/memory`
Create a memory entry.

**Auth**: Required

**Request body**:
```json
{ "content": "I prefer TypeScript over JavaScript" }
```

**Zod schema**:
```typescript
z.object({ content: z.string().min(1).max(2000) })
```

**Success `201`**: Memory entry object.

---

### `PATCH /api/memory/[id]`
Update content or toggle `isActive`.

**Auth**: Required

**Request body**:
```json
{ "content": "Updated fact", "isActive": false }
```

---

### `DELETE /api/memory/[id]`
Delete memory entry.

**Auth**: Required  
**Success `204`**: No body.

---

## 10. Projects

### `POST /api/projects`
Create a project.

**Auth**: Required

**Request body**:
```json
{
  "name": "My Research Project",
  "description": "...",
  "systemPrompt": "You are a research assistant specialized in..."
}
```

**Success `201`**: Project object.

---

### `GET /api/projects`
List user's projects.

**Auth**: Required  
**Success `200`**: Array of projects.

---

### `GET /api/projects/[id]`
Get project with associated conversations.

**Auth**: Required

---

### `PATCH /api/projects/[id]`
Update project name, description, or system prompt.

**Auth**: Required

---

### `DELETE /api/projects/[id]`
Delete project. Conversations are disassociated (`project_id` set to null), not deleted.

**Auth**: Required  
**Success `204`**: No body.
