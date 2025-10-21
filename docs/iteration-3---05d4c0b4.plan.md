<!-- 05d4c0b4-d742-483b-ac11-a3f47a4da424 899b0c98-d25a-4194-af31-7d4edc819449 -->
# Iteration 3 & 4: Search + MCP Server (Flat Architecture)

## Overview

Implement slug/tags-aware search (Iteration 3), then build an MCP server that enables AI agents to search and retrieve documents via Personal Access Tokens (Iteration 4). Updated for flat document architecture - no projects, all documents belong directly to users.

## Phase 1: Schema & Core Utilities

### Schema Changes

Update `packages/app/convex/schema.ts`:

```typescript
documents: defineTable({
  userId: v.string(),
  title: v.string(),
  slug: v.string(),  // URL-friendly segment
  suffix: v.string(), // short unique suffix
  body: v.string(),
  tags: v.array(v.string()),
  updated: v.number(),
  sizeBytes: v.number(),
  createdAt: v.number(),
  revisionToken: v.string(),
})
.index("by_userId", ["userId"])
.index("by_userId_updated", ["userId", "updated"])
.index("by_suffix", ["suffix"]) // used for doc handles

 tokens: defineTable({
  userId: v.string(),
  tokenHash: v.string(),
  name: v.string(),
  createdAt: v.number(),
  lastUsedAt: v.optional(v.number()),
})
.index("by_userId", ["userId"])
.index("by_tokenHash", ["tokenHash"])
```

### Utility Functions

Add to `packages/app/convex/utils.ts`:

1. **Slugification**:
   - `generateDocumentSlugAndSuffix(title, existingSuffixes, currentDocSuffix?)`: slugifies title and returns a unique suffix; reuse suffix when updating the same doc

2. **Token Management**:
   - `generateToken()`: Creates secure random token with `mem_` prefix via `crypto.getRandomValues`
   - `hashToken(token)`: SHA-256 hash via Web Crypto API
   - `validateTokenHash(token, hash)`: Constant-time comparison of hashed token

## Phase 2: Document Slugs & Search

### Update Document Mutations

Modify `packages/app/convex/documents.ts`:

1. **createDocument**: Generate slug + suffix, track collisions within user's documents
2. **updateDocument**: Regenerate slug/suffix when title changes, reusing suffix when possible
3. Backfill helper for legacy docs if needed

### Search Query Implementation

Add `searchDocuments` query to `packages/app/convex/documents.ts`:

```typescript
searchDocuments({
  query: v.string(),
  limit: v.optional(v.number()),  // default 5, max 10
  sort: v.optional(v.union(v.literal("relevance"), v.literal("recency")))
})
```

**Logic:**

- Fetch all user's documents (10 max per user)
- Normalize query, split into tokens; each token must match slug/title/tag
- Weighted scoring: exact/prefix/contains bonuses across slug, title, tags + per-token bonus
- Tie-break: score -> recency -> compound slug
- Return top `limit` results
- **No project scoping** - searches across all user documents

### Route & Handle Strategy

- Keep existing `$docId` routes; slug-based URLs postponed.
- Expose `compoundSlug` (`{slug}-{suffix}`) for sharing and MCP handles.
- Provide copy-handle buttons in workspace/editor UI.

## Phase 3: PAT Management (Backend)

### Token CRUD in Convex

`packages/app/convex/tokens.ts`:

1. **createToken** mutation:
   - Validates name, enforces max 10 tokens
   - Generates token, hashes it, stores hash & metadata
   - Returns plain token once

2. **listUserTokens** query: Returns token metadata ordered by creation

3. **deleteToken** mutation: Validates ownership, deletes token

4. **validateToken** internal query: Hashes supplied token, returns user info if matches

5. **updateTokenLastUsed** internal mutation: Patches `lastUsedAt`

### HTTP Actions for MCP

`packages/app/convex/http.ts` and `packages/app/convex/handlers/mcp.ts`:

1. **POST /mcp/search**:
   - Validates bearer PAT header
   - Parses `{ query, limit?, sort? }` with Zod
   - Calls internal `searchDocumentsForUser`
   - Returns `{ doc_handle, title, updated, approx_size }[]`

2. **POST /mcp/get_document**:
   - Validates bearer PAT
   - Parses `{ doc_handle }`
   - Resolves document via suffix, enforces ownership
   - Returns `{ body, updated, full_size, is_truncated }` (800KB hard cap)

## Phase 4: MCP Server Package

### Package Setup

`packages/mcp-server/`:

```json
{
  "name": "@contextor/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "contextor-mcp": "./dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  }
}
```

### MCP Server Implementation

`packages/mcp-server/src/index.ts`:

1. **Startup validation**:
   - Env vars: `CONTEXTOR_API_URL`, `CONTEXTOR_PAT`
   - Test token validity (project handle removed)

2. **Tool: search**:
   - Input `{ query, limit?, sort? }`
   - Calls `/mcp/search`
   - Returns search results

3. **Tool: get_document**:
   - Input `{ doc_handle }`
   - Calls `/mcp/get_document`
   - Returns truncated body if >800KB

4. Stdio transport per MCP spec

### Build Configuration

- Use `tsup` (or similar) to build ESM output with shebang
- Add npm script to package.json

## Phase 5: UI Updates

### Workspace Header

- Simplify breadcrumbs (no project level)
- Continue fetching document by ID; show copied handle where relevant

### Search UI

- Add search input + results to workspace list page
- Optional sort toggle (`relevance` vs `recency`)
- Surfaces compound slug copy action; navigation remains ID-based

### PAT Management UI

- Settings view/modal for PAT CRUD
- Show created/last-used metadata
- Present token once with copy + warning

### Copy Document Handle UI

- Add copy buttons for compound slug in list & editor header

## Phase 6: Dependencies & Configuration

### Add Dependencies

```bash
# In packages/app
bun add slugify zod

# In packages/mcp-server
bun add @modelcontextprotocol/sdk
```

### Documentation

- Update `packages/app/convex/README.md` to explain schema, search scoring, PAT handling, HTTP endpoints
- Document setup in `packages/mcp-server/README.md` (env vars, example MCP config)
- Note 800KB body cap and compound slug format

### Environment

- Document how to find Convex deployment URL for `CONTEXTOR_API_URL`
- Clarify PAT creation flow in settings UI docs

## Acceptance Criteria

**Iteration 3:**

- Search finds documents by slug/title/tag keywords with AND token matching
- Search ranking weights exact/prefix matches, uses recency as tie-breaker
- Search UI available on workspace list view; navigation remains ID-based
- Workspace header simplified (no project level)

**Iteration 4:**

- Users can generate/delete PATs; hashes stored with constant-time validation
- MCP server connects via stdio with `CONTEXTOR_API_URL` + `CONTEXTOR_PAT`
- `/mcp/search` returns expected results using improved scoring/limit parameters
- `/mcp/get_document` returns body (max 800KB) without frontmatter/max_bytes args
- Clear error message on invalid PAT at startup
- Copy handle button available for compound slugs

### To-dos

- [ ] Update schema with slug/suffix field and tokens table
- [ ] Add slugification and token hashing utilities
- [ ] Update document mutations to generate/regenerate slug+suffix
- [ ] Implement searchDocuments query with weighted scoring logic
- [ ] Keep ID-based routes; add compound slug copy actions
- [ ] Implement PAT CRUD mutations and queries
- [ ] Create HTTP actions for MCP search and get_document
- [ ] Create MCP server package with stdio transport
- [ ] Add search input and results to workspace document list
- [ ] Build PAT management settings page
- [ ] Add copy handle buttons for compound slugs
- [ ] Install required packages (slugify, zod, MCP SDK)
- [ ] Test full flow: generate PAT, configure MCP, search and fetch docs