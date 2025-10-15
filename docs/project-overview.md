# Memoria — Project Overview

## 1. What Memoria Is

Memoria is a **context store for AI agents** that helps you create and maintain project specs, plans, and conventions—then makes them automatically available to your AI tools. Write specs with AI assistance, store them once, and your AI agent pulls exactly what it needs without manual context management.

**Problem:** Working with AI agents means constantly managing context. You paste the same specs, conventions, and plans into chat after chat. Context windows fill up fast, and keeping the AI aligned with your project intent becomes manual overhead. Plus, writing comprehensive specs takes time.

**Solution:** Use Memoria's AI-assisted writing tools to draft feature specs, PRDs, implementation plans, and conventions quickly. Store them in structured Markdown. AI agents retrieve relevant docs automatically through MCP (Model Context Protocol) when they need context—you create it once (with AI help), the agent finds it on its own.

Key terms used throughout this document:

* **ADR (Architecture Decision Record):** A short write-up that explains an important technical decision and why it was made.
* **NSM (North Star Metric):** The single metric we treat as the main measure of product success.
* **MCP (Model Context Protocol):** The protocol we use to let AI agents communicate with Memoria.

## 2. Scope

**Included in Memoria:**
* Feature specs, PRDs, and implementation plans (primary use case)
* High-level project roadmaps and technical strategy
* Architecture and system design notes
* Project-wide patterns, conventions, and style guides
* ADRs and other high-impact decisions
* Glossaries for project-specific language

**Explicitly excluded:**
* Sprint planning, tasks, or ticket tracking
* Meeting minutes and daily notes
* Pull request discussions or changelog dumps
* Chat transcripts
* Raw code search or source browsing tools

## 3. Audience

* Developers who work with AI coding agents and are tired of manually managing context in every conversation.
* Independent developers and small teams who want to write specs once (with AI help) and have their AI tools find them automatically.
* Engineers who need project context to stay up-to-date as work evolves, without maintaining separate prompt libraries.
* Teams who know they should document more but find traditional documentation too time-consuming—AI-assisted authoring makes it fast.

## 4. Product Pillars

* **AI-Assisted Authoring:** Use AI to draft specs, PRDs, and conventions quickly. Templates, rewrite helpers, and smart suggestions that speed up documentation without taking over—you stay in control.
* **Automatic Retrieval:** AI agents find and pull docs on their own through MCP—no manual context management required.
* **Living Specs:** Markdown documents that evolve with your project. Update specs as you go (with AI help); agents always get current info.
* **Integration Layer:** Access through MCP, REST, or CLI; includes an IDE extension with a local cache for fast lookups.
* **Governance & Trust:** Provenance tracking, basic audits, and freshness checks so teams can trust the content.

## 5. Feature Categories

We group features into **Core**, **Supporting**, and **Generic**. If a feature does not clearly belong to Core, we treat it as Supporting by default.

### A. Core

Directly moves the North Star Metric.

1. **MCP-Powered Automatic Retrieval**
   *Why it matters:* This is the entire value proposition. AI agents must be able to find and pull relevant specs, plans, and context on their own through MCP without the developer manually managing what context to provide. We split documents by headings, keep stable anchors, rank results using keywords with semantic fallback, respect freshness signals, and return snippets sized for AI context windows with citations.
2. **Living Document Model**
   *Why it matters:* Without a clear schema, the product fails. This model defines document types (feature specs, PRDs, implementation plans, ADRs, conventions), the frontmatter fields (`title`, `tags`, `topic`, `stability`, `updated`, `project`, `authority_level`), and how documents stay current as projects evolve.

All other features connect to these two through clear interfaces.

### B. Supporting

Helps the core succeed and stay healthy.

1. **Local IDE Companion + MCP/CLI Integration** *(Core — moved from Supporting)*
   *Impact:* This is essential to the value proposition. Gives developers and AI agents low-latency access in their editor. Includes a local cache at `~/.memoria/<workspace>`, change detection using manifest and ETag comparisons, and MCP tools such as `memory.search`, `memory.get`, and `memory.list`. Responses stay within budgeted token sizes.
2. **Memory Quality Tools**
   *Impact:* Keeps specs current. Tracks last-updated timestamps, usage, and gives nudges when specs drift from reality. Supports planned deprecations and shows author confidence levels so AI agents know which docs to trust most.
3. **AI Writing Support** *(candidate for Core)*
   *Impact:* Makes creating specs fast and easy. Provides templates for common doc types (feature specs, PRDs, ADRs), smart rewrite and expansion helpers, and style guidance. AI helps draft comprehensive docs quickly, but outputs are always reviewed by a person before publishing. This removes the friction of starting documentation from scratch.
4. **Provenance View**
   *Impact:* Builds trust. Shows which snippets informed an answer, with timestamps and clickable anchors.
5. **Authoring Experience**
   *Impact:* Makes writing and editing smooth. Offers split-view editing, frontmatter linting, cross-document links, and backlinks.
6. **Organization & Taxonomy**
   *Impact:* Improves findability. Supports multiple projects, folders, tags, topic hubs, and favorites.
7. **Versioning & Review**
   *Impact:* Enables safe collaboration. Includes history, diffs, rollback, suggestion mode, review queues, and an optional Git bridge.
8. **Search UI for People**
   *Impact:* Complements AI usage. Delivers quick keyword search with filters (tags, stability, last updated) and a “recent changes” view.
9. **Import/Export**
   *Impact:* Lowers adoption friction. Handles bulk imports from repos, Obsidian, MkDocs, and exports to plain Markdown plus a manifest.

### C. Generic

Standard capabilities we can buy or integrate.

1. **Identity & Access:** Authentication, SSO, session handling, and simple roles (owner, editor, viewer).
2. **Billing & Plans:** Subscriptions, usage metering, invoicing, trials, and coupon handling.
3. **Operating Basics:** Logging, metrics, tracing, health checks, backups/disaster recovery, and CDN usage.
4. **Notifications:** Email, web, or push alerts for reviews, stale content, or sync issues.
5. **Compliance & Legal:** Terms of service, privacy options, export/erasure workflows, data residency.
6. **Infrastructure Plumbing:** Storage, rate limits, firewall rules, and localization frameworks.

## 6. Operating Rules

* Keep the core modules isolated; each non-core feature lives in its own module and only talks to the core through contracts.
* Integrate through stable APIs or domain events instead of sharing internal types.
* Ship Supporting and Generic features behind feature flags. Each flag can be switched off quickly if needed.
* Prefer reversible changes. If a non-core feature cannot be rolled back easily, we redesign or postpone it.
* Allocate most engineering time to Core, keep Supporting to about one-third per cycle, and keep Generic work minimal.
* Define at least one metric per feature and emit domain events with IDs so we can observe behavior.
* Review feature tags monthly and adjust categories with evidence.
* Use the deletion test: if the overall strategy still holds after removing a feature, it should not be Core.
* Version public interfaces and deprecate old versions instead of breaking them.
* The Core owns the source of truth; Supporting features read and write through Core APIs; Generic integrations manage their own data through adapters.

## 7. Quick Classification Checklist

Use this when scoping any new or changed feature:

1. List the features under consideration.
2. Run the **Core check** (need at least three “yes” answers): Would customers pay for it alone? Does the product fail without it? Is it unique expertise? Does it need deep modeling? Does it directly move the North Star Metric?
3. If it fails the Core check, run the **Supporting check** (need any “yes”): Does it improve adoption or retention of the core? Is it required to deliver or scale the core? Is it tailored to our domain?
4. Otherwise treat it as **Generic** (any “yes”): Is it commodity infrastructure? Could we swap in a vendor? Is building it ourselves a net loss?
5. Mark unclear cases as “Supporting (Candidate Core)” until proven.
6. Record the metric, owning team, feature flag, and a 1–2 week milestone.
7. Prioritize using **Impact + user demand + reversibility − effort**.
8. Ship the top slice, measure results, and adjust the classification when needed.

## 8. Initial Feature Backlog (examples)

| Feature                                              | Category                    | First Slice                               |
| ---------------------------------------------------- | --------------------------- | ----------------------------------------- |
| Markdown schema + canonical doc types                | Core                        | Define types and frontmatter; validate on three seed projects |
| Agent-friendly retrieval (chunking + anchors + ranking) | Core                     | Build chunker, anchor map, and top-k keyword ranking |
| IDE companion (local cache + MCP)                    | Supporting (Candidate Core) | Implement manifest/ETag sync and `memory.get/search` |
| Memory quality tools                                 | Supporting                  | Add staleness score and nudges UI        |
| AI writing support                                   | Supporting                  | Provide templates plus rewrite/summarize helpers |
| Auth + role-based access                             | Generic                     | Launch OAuth with basic roles            |
| Billing                                              | Generic                     | Integrate Stripe basics with plan gates  |

## 9. Risks and Mitigations

* **Specs drifting out of sync with reality:** Use freshness scores, nudges when docs haven't been updated recently, and confidence markers; encourage updates as work progresses. AI writing helpers can suggest updates based on recent changes.
* **Slow responses breaking the AI agent flow:** Keep a local cache, run fast heuristics before semantic search, and respect token budgets so retrieval stays fast.
* **AI-generated content without human oversight:** All AI-assisted drafts require human review before publishing. AI suggests and helps write, but humans approve and refine. Keep guardrails strong so trust in documentation stays high.
* **Expanding into a general wiki or task tool:** Keep scope focused on specs, plans, and conventions that AI agents need—not meeting notes or tickets. Rely on feature flags and apply the deletion test.
* **Hard integrations:** Offer a stable, minimal MCP surface (`search`, `get`, `list`) with practical examples and clear token budget guarantees.

