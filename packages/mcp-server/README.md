# Memoria MCP Server

Personal access token–authenticated Model Context Protocol (MCP) server that lets Claude, Cursor, or any MCP‑compatible client search and read documents stored in Memoria.

## Requirements

- Node.js 18+ (or any runtime with native `fetch`)
- Installed dependencies (`bun install` from the repo root, or `npm install`/`pnpm install` inside this package)
- Personal Access Token generated from the Memoria web app’s token management

## Environment Variables

| Variable      | Required | Description                                                                 |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `MEMORIA_PAT` | ✅       | Personal Access Token generated from the Memoria web app’s token management |
| `DEBUG`       | optional | Set to `true` to enable verbose logging                                |

## Build & Run

```bash
# from the repo root
cd packages/mcp-server
bun install          # or npm/pnpm equivalent
bun run build        # runs tsc and emits dist/

# start the MCP server (stdio transport)
MEMORIA_PAT=mem_... node dist/index.js
```

## MCP Client Configuration

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "memoria": {
      "command": "node",
      "args": ["./path/to/dist/index.js"],
      "env": {
        "MEMORIA_PAT": "mem_your_token_here"
      }
    }
  }
}
```

### Cursor (`~/.cursor/rules.json`)

```json
{
  "mcpServers": {
    "memoria": {
      "command": "node",
      "args": ["./path/to/dist/index.js"],
      "env": {
        "MEMORIA_PAT": "mem_your_token_here"
      }
    }
  }
}
```

## Exposed Tools

| Tool               | Input Schema                                                     | Description                                                                                 |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `search_documents` | `{ query: string, limit?: number (1-10), sort?: "relevance"|"recency" }` | Searches Memoria documents by slug/title/tag. Returns compound handles and metadata.        |
| `get_document`     | `{ doc_handle: string }`                                         | Fetches the full document body via compound slug (e.g. `design-doc-abc123`). 800 KB max.    |

Each tool returns human-readable text plus structured JSON content so clients can post-process results.

## Notes

- Documents are identified by their compound slug (`{slug}-{suffix}`) and truncated server-side at 800 KB to respect Convex limits.
- On startup the MCP server verifies the PAT by issuing a test search; misconfiguration results in a clear error before connecting.
- The server connects to Memoria’s HTTP server; the base URL is fixed and does not require configuration.
- Set `DEBUG=1` to log outbound Memoria API requests and MCP tool execution details.
- Version bumps are managed with Changesets. After merging the automated “Version Packages” PR on `main`, the Release workflow publishes the new version to npm automatically—no manual tagging required.
