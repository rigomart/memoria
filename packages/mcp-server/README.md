# Contextor MCP Server

Personal access token–authenticated Model Context Protocol (MCP) server that lets Claude, Cursor, or any MCP‑compatible client search and read documents stored in Contextor.

## Requirements

- Node.js 18+ (or any runtime with native `fetch`)
- Installed dependencies (`bun install` from the repo root, or `npm install`/`pnpm install` inside this package)
- Personal Access Token generated from the Contextor web app's token management

## Environment Variables

| Variable      | Required | Description                                                                 |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `CONTEXTOR_PAT` | ✅       | Personal Access Token generated from the Contextor web app's token management |
| `DEBUG`       | optional | Set to `true` to enable verbose logging                                |

## Build & Run

```bash
# from the repo root
cd packages/mcp-server
bun install          # or npm/pnpm equivalent
bun run build        # runs tsc and emits dist/

# start the MCP server (stdio transport)
CONTEXTOR_PAT=mem_... node dist/index.js
```

## MCP Client Configuration

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "contextor": {
      "command": "npx",
      "args": [
        "-y",
        "@rigos-lab/contextor-mcp"
      ],
      "env": {
          "CONTEXTOR_PAT": "your_token_here"
      }
    }
  }
}
```

### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.contextor]
command = "npx"
args = ["-y", "@rigos-lab/contextor-mcp"]
env = {"CONTEXTOR_PAT" = "your_token_here"}
```

## Exposed Tools

| Tool               | Input Schema                                                     | Description                                                                                 |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `search_documents` | `{ query: string, limit?: number (1-10), sort?: "relevance"|"recency" }` | Searches Contextor documents by slug/title/tag. Returns compound handles and metadata.        |
| `get_document`     | `{ doc_handle: string }`                                         | Fetches the full document body via compound slug (e.g. `design-doc-abc123`). 800 KB max.    |

Each tool returns human-readable text plus structured JSON content so clients can post-process results.

## Notes

- Documents are identified by their compound slug (`{slug}-{suffix}`) and truncated server-side at 800 KB to respect Convex limits.
- On startup the MCP server verifies the PAT by issuing a test search; misconfiguration results in a clear error before connecting.
- The server connects to Contextor's HTTP server; the base URL is fixed and does not require configuration.
- Set `DEBUG=1` to log outbound Contextor API requests and MCP tool execution details.
- Version bumps are managed with Changesets. After merging the automated "Version Packages" PR on `main`, the Release workflow publishes the new version to npm automatically—no manual tagging required.
