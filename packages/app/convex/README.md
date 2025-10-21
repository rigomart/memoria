# Convex Backend Overview

This directory contains the Convex schema, queries, mutations, and HTTP handlers that power Contextor's document workspace and external MCP integrations.

---

## Tokens (`tokens.ts`)
- Personal access tokens (PATs) are created via `createToken`; names are trimmed, max 10 tokens per user.
- Tokens are generated with 32 bytes of `crypto.getRandomValues`, prefixed with `mem_`.
- Only the SHA-256 hash is stored. Validation uses a constant-time comparison to avoid timing leaks.
- `listUserTokens` returns metadata ordered by newest. `deleteToken` enforces ownership.
- Internal helpers (`validateToken`, `updateTokenLastUsed`) are used by HTTP actions; they expect trimmed bearer tokens and update `lastUsedAt` asynchronously.

## Documents (`documents.ts`)
- Public queries/mutations still rely on `requireUserId`, but shared helpers are exposed for internal use:
  - `getDocumentBySuffixForUser` and `searchDocumentsForUser`.
- Search: accepts `query`, optional `limit` (default 5, cap 10), and optional `sort` (`relevance` or `recency`).
  - Every query token must match somewhere in the slug/title/tags.
  - Scoring rewards exact and prefix matches first, then partial matches, with bonuses per matched token.
  - When scores tie, we favor newer documents before falling back to slug ordering.
- All document responses include a `compoundSlug` (`{slug}-{suffix}`) for routing and handles.
- Document bodies are limited to 800 KB; mutations compute byte size via UTF-8 encoding.

## HTTP / MCP Handlers (`handlers/mcp.ts`, `http.ts`)
- Routes:
  - `POST /mcp/search`
    - Headers: `Authorization: Bearer <token>`.
    - Body schema: `{ "query": string, "limit"?: number ≤ 10, "sort"?: "relevance" | "recency" }`.
    - Returns array of `{ doc_handle, title, updated, approx_size }`.
  - `POST /mcp/get_document`
    - Headers: `Authorization: Bearer <token>`.
    - Body schema: `{ "doc_handle": string }` where handle matches `{slug}-{suffix}`.
    - Returns `{ body, updated, full_size, is_truncated }`. Bodies are truncated server-side at 800 KB to satisfy Convex limits.
- Authentication:
  - Bearer token is required. On success we fetch the associated `userId` via `internal.tokens.validateToken`.
  - `updateTokenLastUsed` is fired in the background; failures are logged but non-fatal.
- Requests are validated with Zod. Bad headers or bodies return 401/400; unexpected errors yield 500 with logging.

## Schema (`schema.ts`)
- `documents` table: stores metadata, slug/suffix, body, tags, timestamps, revision token.
  - Indexes: `by_userId`, `by_userId_updated`, `by_suffix`.
- `tokens` table: stores hashed PATs and metadata.
  - Indexes: `by_userId`, `by_tokenHash`.

## Utilities (`utils.ts`)
- `requireUserId` wraps Convex auth.
- `generateDocumentSlugAndSuffix` ensures unique slug+suffix pairs with retry logic.
- Token helpers:
  - `generateToken`: 32 random bytes → hex → `mem_...`.
  - `hashToken`: SHA-256 via `crypto.subtle`.
  - `validateTokenHash`: constant-time hex comparison after decoding to byte arrays.

---

### Developer Tips
- Always use the internal document helpers when authenticating via PATs inside actions; `requireUserId` won't work in HTTP contexts.
- HTTP handlers should never return the raw token hash. Only expose the clear token at creation time.
- When adjusting document size limits, update both `MAX_DOCUMENT_SIZE_BYTES` in `documents.ts` and the hard cap in `mcpGetDocument`.
