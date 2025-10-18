# Memoria — Context Store Application

Memoria is a **context store for AI agents**. It helps teams draft specs, PRDs, implementation plans, and conventions with AI assistance, store them once, and let their agents retrieve the right context automatically through the Model Context Protocol (MCP).

This package contains the primary React/Convex implementation of that experience.

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) for fast JavaScript runtime and package management
- **Framework**: [React 19](https://react.dev/) with TypeScript
- **Build Tool**: [Vite](https://vite.dev/) with React Compiler enabled
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Radix UI components
- **Routing**: [TanStack Router](https://tanstack.com/router) for type-safe routing
- **Authentication**: [Clerk](https://clerk.com/) for user management and auth
- **Backend**: [Convex](https://convex.dev/) for server-side functions and data persistence
- **Linting**: [Biome](https://biomejs.dev/) for fast linting and formatting

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production
bun build
```

### Preview

```bash
# Preview the production build
bun preview
```

### Linting

```bash
# Run linter and fix issues
bun lint
```

### Testing

```bash
# Run Vitest once (TypeScript/Convex modules)
bun run test

# Watch mode
bun run test:watch
```

Vitest is currently configured with the Node test environment and is scoped to `.test.ts` files in `src/` and `convex/`. Add new suites alongside the modules they cover.

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure the following variables:

- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `VITE_CONVEX_URL`: Your Convex deployment URL

## Project Structure

```
src/
├── components/     # React components
├── routes/         # TanStack Router routes
├── lib/           # Utility functions and configurations
├── hooks/         # Custom React hooks
└── styles/        # Global styles and CSS
```

## Key Capabilities

- **AI-Assisted Authoring**: Draft specs, ADRs, plans, and conventions with structured Markdown helpers.
- **Automatic Retrieval via MCP**: AI agents resolve relevant docs through MCP tools (`memory.search`, `memory.get`, `memory.list`) without manual prompt stuffing.
- **Living Specs & Governance**: Track freshness, provenance, and authority signals so agents trust the content they receive.
- **Integration Friendly**: REST/MCP entry points and an IDE companion for low-latency access when coding.

## Development Notes

- This project uses Bun as the primary runtime and package manager
- React Compiler is enabled for automatic optimizations
- The application is configured with TypeScript strict mode
- Biome is used for consistent code formatting and linting
- Tailwind CSS is configured with the new v4 engine
