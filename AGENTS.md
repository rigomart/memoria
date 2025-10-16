# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Bun workspaces. Core app lives in `packages/app`, with subfolders for `src`, `convex` backend functions, and shared configuration.
- Frontend code is under `packages/app/src`, organized by feature: routes in `src/routes`, reusable UI in `src/components`, utilities in `src/lib`, and assets in `src/assets`.
- Convex database schema and functions are stored in `packages/app/convex`. Generated API types reside in `packages/app/convex/_generated`.
- Keep new feature code colocated with its route (e.g., `src/routes/projects/-components`) and reuse existing shadcn/ui components from `src/components/ui`.

## Build, Test, and Development Commands
- `bun run dev` – Starts the Vite dev server (only if a local run is needed; avoid when another session already has it running).
- `bunx --bun tsc --noEmit` – Type-checks the project against the current schema.
- `bun run lint` – Runs Biome to lint and format ([auto-fix] enabled). Some Tailwind at-rule warnings may persist; note them instead of suppressing silently.
- `bun run build` – Executes the production build (Vite + TypeScript project references).

## Coding Style & Naming Conventions
- TypeScript/React throughout; use modern ES modules and functional components.
- Prefer existing shadcn/ui primitives and colocated feature components (`-components` folders).
- Follow Biome’s formatting; avoid manual overrides. Use kebab-case for filenames and camelCase for variables/functions.
- Keep Convex functions lean, exporting queries/mutations from `packages/app/convex`. Reuse `requireUserId` and other shared helpers.

## Testing Guidelines
- TypeScript checking and linting are the current safety net. No dedicated unit-test suite is configured yet; add targeted tests when introducing critical logic.
- When adding tests, colocate them near the implementation and document the command needed to run them.

## Commit & Pull Request Guidelines
- Write descriptive, imperative commit messages (e.g., “Add document breadcrumb helper”). Group related edits together.
- Pull requests should describe scope, note any UI changes (screenshots recommended), and call out backend schema updates or migration steps.
- Always run type-check and lint before submitting. Mention any expected lint warnings (e.g., Tailwind `@custom-variant`) in the PR description.

## Agent-Specific Instructions
- Do not run `convex dev` or other long-lived processes when they may already be active; request results from the host instead.
- Avoid destructive git commands (`reset --hard`, `checkout -- .`). Never revert user-owned changes unless explicitly asked.
- Do not add new dependencies without asking first.
