# Iteration 1 — Foundations (Convex + Clerk + Projects)

**Goal:** Auth + projects + basic doc CRUD (no editor yet).

* Sign in with Clerk; show empty state.
* Create/delete **projects** (uses immutable **Project Handle**).
* Inside a project: create/delete **documents** (plain textarea), enforce caps: **2 projects, 5 docs/project, 800 KB/doc**.
* Require **frontmatter** on save; minimal validation + helpful errors; auto-fill on first save if missing.
* Basic list + view page.
  **Acceptance:** User can sign in, create a project, add docs, and view them; limits enforced.

# Iteration 2 — Authoring v1 (+ Realtime & Conflict Guardrail)

**Goal:** Comfortable editing with safety.

* Markdown editor (preview toggle), stores canonical raw markdown.
* **Revision token** on save; stale saves rejected with friendly “Reload / Compare” path.
* **Realtime indicator**: if the server version changes (e.g., another tab), show banner; escalate to modal only on save attempt.
* Lightweight activity log (save success/fail).
  **Acceptance:** Editing is smooth; conflicts never overwrite silently; realtime indicator visible when doc updates elsewhere.

# Iteration 3 — Import / Export (.md)

**Goal:** Single-file I/O with auto-fix.

* **Import .md**: parse; validate required frontmatter categories; **auto-fill missing** (title placeholder, tags=[], status=draft, updated=now); show post-import review banner.
* **Export .md**: frontmatter + body exactly as stored.
  **Acceptance:** User can round-trip a doc; imports without full frontmatter succeed with clear auto-filled fields.

# Iteration 4 — Title-only Search (UI + API)

**Goal:** Fast, predictable lookup within a project.

* Project-scoped **search by title** (AND across tokens; case-insensitive; accent-folded).
* Ranking: exact match > starts-with > contains; stable tiebreak by handle.
* Minimal UI: search box on docs list; optional sort by **recency**.
* (Optional) tag filter applies **after** title search (keeps v1 simple).
  **Acceptance:** Search finds docs by title reliably; order is deterministic; works within project scope.

# Iteration 5 — MCP Server (stdio) + Two Tools

**Goal:** Agents can retrieve Memoria content locally.

* Package **`memoria-mcp`** (standalone, stdio).
* **Env-only config (no flags):** `MEMORIA_API_URL`, `MEMORIA_PAT`, `MEMORIA_PROJECT` (handle).
* On startup: resolve project; if missing → consistent “Project not found—copy the handle from the app.”
* **Tools:**

  1. `search`: inputs `{ q, top_k?, sort? }`; output hits `{ doc_handle, title, updated, approx_size }` (title-only search).
  2. `get_document`: inputs `{ doc_handle, max_bytes? }`; output `{ frontmatter, body, updated, full_size, is_truncated }`.
     Default body cap **64 KB**, hard-max **800 KB**.
* UX: “**Copy Handle for MCP**” action in UI.
  **Acceptance:** Claude/Cursor can search and fetch docs for the configured project using stdio MCP.

# Iteration 6 — Snapshots Safety Net (+ Restore)

**Goal:** Easy recovery without heavy history UI.

* On each save, keep **last 5 snapshots per doc**; **auto-prune**.
* Snapshots **don’t count** toward the 800 KB/doc cap; enforce a **global 50-snapshot/project** ceiling.
* “Restore previous version” action (replaces head; confirms).
  **Acceptance:** Accidental edits are reversible; storage bounded by caps.

# Iteration 7 — Governance, Quotas & Polish

**Goal:** Ship-ready basics and observability.

* Strict frontmatter validation (clear errors), gentle nudges to complete metadata after imports.
* Rate limits: ~1 write/sec, ~3 searches/sec (surface friendly error banners).
* Tiny status pane (counts, recent errors, zero-result searches).
* Empty states, toasts, and “what changed” notes for MCP defaults (64 KB cap, project scoping).
  **Acceptance:** App feels coherent; limits obvious; basic health visible.

---

## Guardrails & Future-proofing (kept light)

* **No chunking/anchors in v1.** Contracts already future-safe (MCP `get_document` delivers full body with size caps).
* Explore a dedicated **`versions`** collection for storing immutable document bodies so the primary `documents` table can stay metadata-focused while retaining multiple revisions.
* Harden the workspace tree query (Convex + router caching) so breadcrumbs continue to work as project/document counts grow and clients can progressively render partial data.
* Later upgrades: per-section anchors/chunking, semantic re-rank, folder import/export, multi-user, richer version history—all without breaking v1 MCP/tool shapes.
