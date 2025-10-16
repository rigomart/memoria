<!-- 05d4c0b4-d742-483b-ac11-a3f47a4da424 899b0c98-d25a-4194-af31-7d4edc819449 -->
# Iteration 3 & 4: Search + MCP Server (Flat Architecture)

## Overview

Implement title-based search using document slugs (Iteration 3), then build an MCP server that enables AI agents to search and retrieve documents via Personal Access Tokens (Iteration 4). Updated for flat document architecture - no projects, all documents belong directly to users.

## Phase 1: Schema & Core Utilities

### Schema Changes

Update `packages/app/convex/schema.ts`:

```typescript
documents: defineTable({
  userId: v.string(),
  title: v.string(),
  slug: v.string(),  // URL-friendly, regenerated on title change
  body: v.string(),
  tags: v.array(v.string()),
  status: v.string(),
  updated: v.number(),
  sizeBytes: v.number(),
  createdAt: v.number(),
  revisionToken: v.string(),
})
.index("by_userId", ["userId"])
.index("by_userId_updated", ["userId", "updated"])
.index("by_userId_slug", ["userId", "slug"]) // for URL lookups

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

1. **Slugification** (add `slugify` package dependency):

   - `generateDocumentSlug(title: string, userId: string, existingSlugs: string[], docId?: string)`: Creates slug with collision handling
   - Collision strategy: append last segment of Convex ID
   - Query existing slugs scoped to user (not project)

2. **Token Management**:

   - `generateToken()`: Creates secure random token with `mem_` prefix using crypto.getRandomValues
   - `hashToken(token: string)`: SHA-256 hash using Web Crypto API
   - `validateTokenHash(token: string, hash: string)`: Compares hashed token

## Phase 2: Document Slugs & Search

### Update Document Mutations

Modify `packages/app/convex/documents.ts`:

1. **createDocument**: Generate initial slug from title, check for collisions within user's documents
2. **updateDocument**: Regenerate slug when title changes, handle collisions within user scope
3. Add migration helper to backfill slugs for existing documents (if any)

### Search Query Implementation

Add `searchDocuments` query to `packages/app/convex/documents.ts`:

```typescript
searchDocuments({
  q: v.string(),
  top_k: v.optional(v.number()),  // default 5, max 10
  sort: v.optional(v.union(v.literal("relevance"), v.literal("recency")))
})
```

**Logic:**

- Fetch all user's documents (10 max per user)
- Normalize query, split on `-` to get tokens
- Filter: ALL query tokens must appear in slug tokens (AND behavior)
- Rank: exact match (1000) > starts-with (500) > contains (100)
- Stable tiebreak by slug
- Return top_k results
- **No project scoping** - searches across all user documents

### Update Routes to Use Slugs

Change route from `$docId` to `$docSlug`:

- `packages/app/src/routes/_authenticated/workspace/$docId/` → `$docSlug/`
- Update route params and queries to use slug lookup via `by_userId_slug` index
- Update navigation/links throughout app

## Phase 3: PAT Management (Backend)

### Token CRUD in Convex

Add `packages/app/convex/tokens.ts`:

1. **createToken** mutation:

   - Generates token, hashes it, stores in DB
   - Returns plain token ONCE (never shown again)

2. **listUserTokens** query: Returns tokens for current user (without hashes)

3. **deleteToken** mutation: Removes token by ID

4. **validateToken** internal helper: Given plain token, finds matching hash, returns userId

### HTTP Actions for MCP

Add `packages/app/convex/http.ts`:

**Key change from original plan:** No project scoping - MCP accesses all user documents.

1. **POST /api/mcp/search**:

   - Validates PAT from `Authorization: Bearer {token}` header
   - Calls `searchDocuments` query for authenticated user
   - Returns `{ doc_handle, title, updated, approx_size }[]`
   - **No MEMORIA_PROJECT needed** - searches all user docs

2. **POST /api/mcp/get_document**:

   - Validates PAT
   - Accepts `{ doc_handle, max_bytes? }` (default 64KB, max 800KB)
   - Fetches document by slug for authenticated user
   - Truncates body if needed
   - Returns `{ frontmatter, body, updated, full_size, is_truncated }`

## Phase 4: MCP Server Package

### Package Setup

Create `packages/mcp-server/`:

```json
{
  "name": "@memoria/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "memoria-mcp": "./dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  }
}
```

### MCP Server Implementation

`packages/mcp-server/src/index.ts`:

**Key change:** Simpler configuration without project handle.

1. **Startup validation**:

   - Read env vars: `MEMORIA_API_URL`, `MEMORIA_PAT`
   - **Removed:** `MEMORIA_PROJECT` (no longer needed)
   - Validate token works via test API call
   - Exit with clear error if token invalid

2. **Tool: search**:

   - Input: `{ q: string, top_k?: number, sort?: "relevance" | "recency" }`
   - Calls `/api/mcp/search`
   - Returns search results across all user documents

3. **Tool: get_document**:

   - Input: `{ doc_handle: string, max_bytes?: number }`
   - Calls `/api/mcp/get_document`
   - Returns document content

4. Use stdio transport (as per MCP spec)

### Build Configuration

Add build script using `tsup` or similar for ESM output with shebang.

## Phase 5: UI Updates

### Update Workspace Header

Modify `packages/app/src/routes/_authenticated/workspace/-components/workspace-header.tsx`:

**Simplify breadcrumbs** - remove project level:

```
Logo > Workspace > [Document Title]
```

- Remove `getWorkspaceTree` query (no longer needed)
- Remove project breadcrumb level
- Keep document breadcrumb when viewing a doc
- Fetch current document by `docSlug` param when needed
- Query: `getDocumentBySlug({ slug })` instead of complex workspace tree

### Search UI

Add to `packages/app/src/routes/_authenticated/workspace/index.tsx`:

1. Search input box (debounced)
2. Call `searchDocuments` query
3. Display results with highlighting
4. Optional: Sort toggle (relevance vs recency)
5. **No project filter** - searches all user docs

### PAT Management UI

Add settings route `packages/app/src/routes/_authenticated/settings.tsx` or modal:

1. List existing tokens (name, created date, last used)
2. "Generate New Token" button → modal with name input
3. Show token once with "Copy" button and warning
4. Delete token action
5. Instructions: "Use this token to authenticate MCP server"

### Copy Document Slug UI

Add copy button to document UI:

- In document list items (workspace index)
- In document editor header
- Tooltip: "Copy document handle for MCP"

**No project handle copy needed** - removed from plan.

## Phase 6: Dependencies & Configuration

### Add Dependencies

```bash
# In packages/app
bun add slugify

# In packages/mcp-server  
bun add @modelcontextprotocol/sdk
```

### Documentation

Create `packages/mcp-server/README.md` with:

- Setup instructions (env vars)
- Example MCP configuration for Claude/Cursor:
  ```json
  {
    "mcpServers": {
      "memoria": {
        "command": "npx",
        "args": ["@memoria/mcp-server"],
        "env": {
          "MEMORIA_API_URL": "https://your-convex-url.convex.cloud",
          "MEMORIA_PAT": "mem_your_token_here"
        }
      }
    }
  }
  ```

- Tool usage examples
- **Note:** No project scoping - searches across all documents

### Update Convex Deployment URL

Document where users find their Convex deployment URL for `MEMORIA_API_URL` configuration.

## Acceptance Criteria

**Iteration 3:**

- Search finds documents by title reliably with AND token matching across all user documents
- Search ranking is deterministic (exact > starts-with > contains)
- Documents accessible via clean slug-based URLs: `/workspace/{slug}`
- Search UI functional on workspace document list page
- Workspace header breadcrumbs simplified (no project level)

**Iteration 4:**

- Users can generate/delete PATs from settings
- MCP server connects via stdio with simple env configuration (no project handle needed)
- `search` tool returns expected results across all user documents
- `get_document` tool fetches documents with size limits (64KB default, 800KB max)
- Clear error message if PAT is invalid at MCP startup
- Copy document slug button available in UI

### To-dos

- [ ] Update schema with slug field and tokens table
- [ ] Add slugification and token hashing utilities
- [ ] Update document mutations to generate/regenerate slugs
- [ ] Implement searchDocuments query with ranking logic
- [ ] Migrate routes from docId to docSlug
- [ ] Implement PAT CRUD mutations and queries
- [ ] Create HTTP actions for MCP search and get_document
- [ ] Create MCP server package with stdio transport
- [ ] Add search input and results to project document list
- [ ] Build PAT management settings page
- [ ] Add copy handle buttons to project and document UI
- [ ] Install required packages (slugify, MCP SDK)
- [ ] Test full flow: generate PAT, configure MCP, search and fetch docs