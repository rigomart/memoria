# Memoria Monorepo

Memoria is a **context store for AI agents**. It helps teams draft specs, PRDs, plans, and conventions with AI assistance, store them once, and let agents retrieve relevant context automatically via MCP—no more manual copy/paste of project knowledge.

This repository is a Bun-powered monorepo. The primary application lives in `packages/app`, and supporting assets (documentation, MCP tooling experiments, etc.) live alongside it.

## Getting Started

```bash
# Install workspace dependencies
bun install
```

### Useful Commands

- `bun run dev` – start the Memoria app locally (Vite dev server)
- `bun run build` – build all workspaces
- `bun run check-types` – run TypeScript project references in no-emit mode
- `bun run lint` – run Biome with autofix enabled
- `bun run test` – execute Vitest against the app workspace (TypeScript targets only)

> Vitest currently focuses on non-React TypeScript modules (Convex helpers, utilities, etc.). Extend coverage as you add critical logic.

## Workspace Layout

- `packages/app` – Frontend/Convex implementation of the context store
- `docs` – Product plans, specifications, and project overview docs
- `packages/mcp-server` – MCP integration tooling (experiments)

Each workspace manages its own scripts; use `bun run --filter <workspace> <script>` for workspace-specific tasks.

## Contributing

1. Create a feature branch.
2. Make changes scoped to a single concern.
3. Run `bun run check-types`, `bun run lint`, and (when applicable) `bun run test`.
4. Submit a PR with screenshots of UI changes and notes about any backend/schema updates.

Refer to `AGENTS.md` for detailed conventions around project structure, naming, and agent responsibilities.
