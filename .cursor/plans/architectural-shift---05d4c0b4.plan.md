<!-- 05d4c0b4-d742-483b-ac11-a3f47a4da424 ff50e3d7-05fb-4fce-acd9-a6154138d731 -->
# Remove Projects - Flat Document Architecture

## Overview

Refactor from project-scoped documents to a flat, user-level document collection. Documents will be organized via tags and search instead of project containers. This unblocks using Memoria as a global knowledge base for architecture patterns, decisions, and specs.

## Phase 1: Schema Migration

### Update Schema

In `packages/app/convex/schema.ts`:

**Remove:**

- `projects` table entirely
- `projectId` field from documents
- All project-related indexes

**Keep:**

```typescript
documents: defineTable({
  userId: v.string(),         // NEW: direct user ownership
  title: v.string(),
  body: v.string(),
  tags: v.array(v.string()),  // PRIMARY organization mechanism
  status: v.string(),
  updated: v.number(),
  sizeBytes: v.number(),
  createdAt: v.number(),
  revisionToken: v.string(),
})
.index("by_userId", ["userId"])
.index("by_userId_updated", ["userId", "updated"]) // for sorting
```

**Update limits:**

- Total documents per user: 10 (down from 2 × 5)
- Keep 800KB per document

## Phase 2: Convex Functions Refactor

### Remove Files

Delete `packages/app/convex/projects.ts` and `packages/app/convex/workspace.ts` entirely.

### Update `packages/app/convex/documents.ts`

**createDocument mutation:**

- Remove `projectId` arg
- Check total user documents ≤ 10
- Add `userId` field directly to document

**updateDocument mutation:**

- Remove project ownership check
- Keep user ownership check via document.userId

**deleteDocument mutation:**

- Remove project ownership check
- Keep user ownership check

**listUserDocuments query (renamed from listProjectDocuments):**

- Remove `projectId` arg
- Query by `userId` using `by_userId` index
- Sort by `updated` descending

**getDocument query:**

- Remove project check
- Verify document belongs to current user

### Update `packages/app/convex/utils.ts`

**Remove:**

- `generateProjectHandle` function (no longer needed)

**Keep:**

- `requireUserId` helper (still needed for user auth)

## Phase 3: Route Restructuring

### New Route Structure

```
/workspace
  └── $docId/
      └── index.tsx
```

**Changes:**

- Remove `/workspace/$projectHandle/` level entirely
- Documents directly under `/workspace/`
- URL pattern: `/workspace/{docId}` (will change to slug in Iteration 3)

### Files to Update

**Remove:**

- `packages/app/src/routes/_authenticated/workspace/-components/project-card.tsx`

**Keep (with modifications):**

- `packages/app/src/routes/_authenticated/workspace/route.tsx` - Keep the layout structure
- `packages/app/src/routes/_authenticated/workspace/-components/workspace-header.tsx` - Simplify breadcrumbs

**Update:**

- `packages/app/src/routes/_authenticated/workspace/index.tsx`: Show all user documents (not grouped by project)
- `packages/app/src/routes/_authenticated/workspace/$docId/index.tsx`: Remove project context, use direct document lookup

**Create:**

- New workspace header showing total docs, search, and filters by tag

## Phase 4: UI Updates

### Workspace Index Page

**Completely rewrite** `packages/app/src/routes/_authenticated/workspace/index.tsx`:

- **Use as reference:** Copy structure from `$projectHandle/index.tsx` (the document list page)
- **Changes from reference:**
  - Remove all project-related logic and props
  - Change header from project name to "Documents"
  - Change limit from 5 to 10 documents
  - Update query from `listProjectDocuments` to `listUserDocuments`
  - Update navigation from `/workspace/$projectHandle/$docId` to `/workspace/$docId`
  - Update empty state description to reference global knowledge base use cases

**Key components:**

1. Header: "Documents" title, 10-doc limit counter
2. "New Document" button + dialog (reuse existing dialog component)
3. Document list using `DocumentListItem` component
4. Empty state for first-time users

### Document View/Edit Page

In `packages/app/src/routes/_authenticated/workspace/$docId/index.tsx`:

1. **Remove breadcrumb/project context**
2. **Update queries:**

   - Remove project handle lookups
   - Fetch document directly by ID

3. **Navigation:**

   - Back button → `/workspace` (document list)
   - Remove project-level navigation

### Update Components

**Document List Item:**

- In `packages/app/src/routes/_authenticated/workspace/$projectHandle/-components/document-list-item.tsx`
- Move to `packages/app/src/routes/_authenticated/workspace/-components/document-list-item.tsx`
- Remove project references
- Update navigation links

## Phase 5: Migration & Data Handling

### Handle Existing Data

If there's any existing data in development:

1. Create a migration helper in `packages/app/convex/migrations.ts`:

   - Fetch all existing documents
   - For each document, extract `userId` from parent project
   - Update document to have direct `userId` field
   - Delete all projects after migration

2. Add mutation to run migration manually (not auto-run)

### Testing Checklist

After refactor:

- [ ] Can create documents (respects 10 doc limit)
- [ ] Can view/edit documents
- [ ] Can delete documents
- [ ] Tags are preserved and displayed
- [ ] No broken project references in UI
- [ ] Routes work correctly
- [ ] Type checking passes

## Phase 6: Update Configuration

### Route Tree Regeneration

Run TanStack Router codegen to update route tree:

```bash
cd packages/app
bun run dev  # Should trigger route generation
```

### Type Checking

Ensure all project-related types are removed:

```bash
bunx --bun tsc --noEmit
```

## Acceptance Criteria

- Projects table and all project-related code removed
- Users can create up to 10 documents total
- Documents accessed directly via `/workspace/{docId}`
- All documents listed on workspace index, sortable by recency
- Tags visible and ready for filtering (implementation in Iteration 3)
- No TypeScript errors or broken references
- UI flows work end-to-end (create, view, edit, delete documents)

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