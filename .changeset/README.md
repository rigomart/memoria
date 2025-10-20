# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to track release notes and version bumps.

- Run `bun run changeset` to create a new changeset after making user-facing changes.
- When a changeset PR merges, the version workflow will bump package versions and trigger the publish pipeline for `@mirdor/memoria-mcp`.
- The app workspace `@memoria/app` is ignored because it is not published to npm.
