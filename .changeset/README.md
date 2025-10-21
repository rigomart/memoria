# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) to track release notes and version bumps.

- Run `bun run changeset` to create a new changeset after making user-facing changes.
- When a changeset PR merges into `main`, the Release workflow bumps package versions and, after the automated PR merges, publishes `@rigos-lab/contextor-mcp` to npm.
- The app workspace `@contextor/app` is ignored because it is not published to npm.
