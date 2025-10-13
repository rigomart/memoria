# Memoria — Knowledge Base Application

Memoria is a **Markdown-based knowledge base for developers** that helps teams keep track of architectural choices, conventions, and key feature details in a way that is easy for people—and AI coding tools—to use quickly.

This is the main React application for the Memoria platform.

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

## Key Features

- **Project Knowledge Management**: Capture architectural decisions and conventions
- **AI-Friendly Content**: Structured Markdown documents optimized for AI tools
- **Real-time Collaboration**: Multiple users working together
- **Search & Discovery**: Fast search across all knowledge documents
- **Version Control**: Track changes and maintain history

## Development Notes

- This project uses Bun as the primary runtime and package manager
- React Compiler is enabled for automatic optimizations
- The application is configured with TypeScript strict mode
- Biome is used for consistent code formatting and linting
- Tailwind CSS is configured with the new v4 engine
