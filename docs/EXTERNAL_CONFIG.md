# AI Workspace — External Configuration Requirements

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

This document lists every external service, credential, and configuration item required before or during implementation.  
Nothing is assumed to be available unless confirmed.

---

## 1. Required Before Phase 01 (Scaffold)

These are needed immediately.

### 1.1 Node.js Runtime

| Item | Requirement | Status |
|------|-------------|--------|
| Node.js | ≥ 20.x (LTS) | ✅ v24.16.0 detected |
| npm | ≥ 10.x | ✅ v11.13.0 detected |

No action needed.

---

## 2. Required Before Phase 02 (Database)

### 2.1 Supabase Project

A Supabase project is required. Two options:

#### Option A — Supabase Cloud (Recommended for production path)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project. Note your region choice — it affects latency.
3. Wait for the project to provision (~2 min).
4. From **Project Settings → API**, collect:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role key (**server-only, never expose**) |

5. From **Project Settings → Database**, collect:
   - Direct connection string (for migrations if using Supabase CLI)

#### Option B — Supabase Local (Development only)

Requires Docker Desktop installed and running.

```bash
npx supabase init
npx supabase start
# This outputs local URLs and keys
```

> **Note**: Local Supabase requires Docker. If Docker is not available, use Option A.

**Question for you**: Do you have Docker Desktop installed, or should we use Supabase Cloud directly?

---

### 2.2 Supabase Storage Bucket

After the project is created, the `user-uploads` bucket will be created by our migration. No manual step needed beyond the project creation.

---

### 2.3 Supabase Email Auth

By default, Supabase enables email/password authentication. Confirm:
- Email confirmations: Enabled or disabled? (Disabling simplifies local dev)
- For production: Configure SMTP settings in Supabase Auth → Email Settings.

**Default for MVP**: Disable email confirmation for faster local testing. Enable for production.

---

## 3. Required Before Phase 05 (API Key Encryption)

### 3.1 `KEY_ENCRYPTION_SECRET`

A 64-character hex string (32 bytes) used as the AES-256-GCM encryption key for user API keys.

**Generate it**:
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32
```

**Store it in**: `.env.local` (never commit this file)

```env
KEY_ENCRYPTION_SECRET=<your-64-hex-chars>
```

> **Critical**: This secret cannot be changed after user API keys have been stored without re-encrypting all existing keys. Choose it once and protect it.

---

## 4. Required Before Phase 06 (Model Listing)

### 4.1 OpenRouter Account & API Key (For Testing)

For the application to fetch the model list and make AI calls during development, you need a personal OpenRouter API key to use as a test key in the application's Settings UI.

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and generate an API key.
3. Add credits if you want to test paid models. Free models work without credits.
4. This key is **not an environment variable** — it is entered through the app's Settings UI during testing.

> **Note**: The app does **not** need an OpenRouter key as an environment variable. Each user provides their own key through the UI. The developer testing the app uses their own personal key through the Settings page.

---

## 5. Required Before Phase 13 (Web Search)

### 5.1 Web Search Provider

Web search requires a provider. Options ranked by simplicity:

| Provider | Cost | Notes |
|----------|------|-------|
| **OpenRouter Tool Use** | Per-request | Uses OpenRouter's built-in web search tools — no extra account needed if models support it |
| **Brave Search API** | Free tier: 2000 req/month | Simple REST API, good quality |
| **Serper.dev** | Free tier: 100 req | Google results via API |
| **Tavily** | Free tier: 1000 req/month | AI-optimized results |

**Recommended**: Start with OpenRouter's built-in tool use. If the selected model doesn't support tool use, fall back to Brave Search.

**For Brave Search** (if chosen):
1. Register at [brave.com/search/api](https://brave.com/search/api)
2. Get API key
3. Add to `.env.local`:
```env
BRAVE_SEARCH_API_KEY=<your-key>
SEARCH_PROVIDER=brave
```

**Question for you**: Which web search provider do you prefer?

---

## 6. Environment Variable Template

The file `.env.local.example` will be created in Phase 01 with this content:

```env
# =============================================================================
# SUPABASE
# =============================================================================

# From Supabase Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only — NEVER expose to client
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# =============================================================================
# ENCRYPTION
# =============================================================================

# 64-char hex string — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# CRITICAL: Never change after storing user keys without migrating all encrypted values
KEY_ENCRYPTION_SECRET=

# =============================================================================
# APPLICATION
# =============================================================================

NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# WEB SEARCH (Phase 13 — optional for MVP)
# =============================================================================

# Options: brave | serper | tavily | openrouter-tools
SEARCH_PROVIDER=openrouter-tools

# Required if SEARCH_PROVIDER=brave
BRAVE_SEARCH_API_KEY=

# Required if SEARCH_PROVIDER=serper
SERPER_API_KEY=

# Required if SEARCH_PROVIDER=tavily
TAVILY_API_KEY=

# =============================================================================
# RATE LIMITING (optional — in-memory by default)
# =============================================================================

# Redis connection string for production rate limiting
# REDIS_URL=redis://localhost:6379
```

---

## 7. Summary of Required Actions

Before Phase 01:
- [ ] _(No external actions required — workspace is ready)_

Before Phase 02:
- [ ] **Decision**: Supabase Cloud or Local (Docker)?
- [ ] **Action**: Create Supabase project (if Cloud)
- [ ] **Provide**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Before Phase 05:
- [ ] **Action**: Generate `KEY_ENCRYPTION_SECRET` (command provided above)
- [ ] **Action**: Create `.env.local` with the secret

Before Phase 06 (developer testing):
- [ ] **Action**: Create personal OpenRouter account
- [ ] **Action**: Generate personal OpenRouter API key (enters via app UI, not env var)

Before Phase 13:
- [ ] **Decision**: Web search provider
- [ ] **Action**: Register with chosen provider if not OpenRouter tools
- [ ] **Provide**: Relevant search API key
