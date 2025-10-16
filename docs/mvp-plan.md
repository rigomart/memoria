# Iteration 1 — Foundations (Convex + Clerk + Documents)

**Goal:** Auth + basic doc CRUD (no editor yet).

* Sign in with Clerk; show empty state.
* Create/delete **documents** (plain textarea), enforce caps: **10 docs/user, 800 KB/doc**.
* Documents organized by **tags** (not projects); immutable **document slug** generated from title.
* Require **frontmatter** on save; minimal validation + helpful errors; auto-fill on first save if missing.
* Basic list + view page.
  **Acceptance:** User can sign in, create documents, add tags, and view them; limits enforced.

# Iteration 2 — Authoring v1 (+ Realtime & Conflict Guardrail)

**Goal:** Comfortable editing with safety.

* Markdown editor (preview toggle), stores canonical raw markdown.
* **Revision token** on save; stale saves rejected with friendly “Reload / Compare” path.
* **Realtime indicator**: if the server version changes (e.g., another tab), show banner; escalate to modal only on save attempt.
* Lightweight activity log (save success/fail).
  **Acceptance:** Editing is smooth; conflicts never overwrite silently; realtime indicator visible when doc updates elsewhere.

# Iteration 3 — Title-only Search (UI + API)

**Goal:** Fast, predictable lookup across all user documents.

* User-scoped **search by title** (AND across tokens; case-insensitive; accent-folded).
* Ranking: exact match > starts-with > contains; stable tiebreak by slug.
* Search uses document **slugs** (URL-friendly, regenerated on title change).
* Minimal UI: search box on docs list; optional sort by **recency**.
* (Optional) tag filter applies **after** title search (keeps v1 simple).
  **Acceptance:** Search finds docs by title reliably; order is deterministic; searches all user documents.

# Iteration 4 — MCP Server (stdio) + Two Tools + PAT Auth

**Goal:** Agents can retrieve Memoria content locally with secure authentication.

* Package **`@memoria/mcp-server`** (standalone, stdio).
* **User-level PAT authentication:** Generate Personal Access Tokens (hashed SHA-256) via settings UI.
* **Env-only config (no flags):** `MEMORIA_API_URL`, `MEMORIA_PAT`.
* On startup: validate PAT; if invalid → consistent "Invalid token—generate a new PAT from settings."
* **Tools:**

  1. `search`: inputs `{ q, top_k?, sort? }`; output hits `{ doc_handle, title, updated, approx_size }` (searches all user docs).
  2. `get_document`: inputs `{ doc_handle, max_bytes? }`; output `{ frontmatter, body, updated, full_size, is_truncated }`.
     Default body cap **64 KB**, hard-max **800 KB**.
* UX: PAT management in settings; "**Copy Slug**" action on documents.
  **Acceptance:** Claude/Cursor can search and fetch all user docs using stdio MCP with PAT authentication.

# Iteration 5 — Snapshots Safety Net (+ Restore)

**Goal:** Easy recovery without heavy history UI.

* On each save, keep **last 5 snapshots per doc**; **auto-prune**.
* Snapshots **don't count** toward the 800 KB/doc cap; enforce a **global 50-snapshot/user** ceiling.
* "Restore previous version" action (replaces head; confirms).
  **Acceptance:** Accidental edits are reversible; storage bounded by caps.

# Iteration 6 — Governance, Quotas & Polish

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
* Documents organized via **tags** in v1; future iterations may add optional project/collection grouping for better organization while keeping the flat architecture backward-compatible.
* Later upgrades: per-section anchors/chunking, semantic re-rank, folder import/export, project grouping, multi-user, richer version history—all without breaking v1 MCP/tool shapes.
