---
"@mirdor/memoria-mcp": patch
---

Centralized shared tooling by adding Biome and Changesets as dev dependencies and scripts at the repo root, removing duplicated Biome installs across workspaces. Initialized Changesets so only `@mirdor/memoria-mcp` is versioned, with documentation for contributor workflow and release steps. Also added two GitHub workflows that trigger when pushing an `mcp-server-v*` tag to handle versioning and publishing.
