import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import type { DocumentResponse, MemoriaClient, SearchResult } from "./client";
import type { Logger } from "./logger";

const searchInputSchema = {
  query: z.string().min(1, "query must be at least one character long").max(200),
  limit: z.number().int().min(1).max(10).optional(),
  sort: z.enum(["relevance", "recency"]).optional(),
} as const;

const getDocumentInputSchema = {
  doc_handle: z
    .string()
    .min(3, "doc_handle must include a slug and suffix (e.g. design-doc-abc123)")
    .regex(/.+-.+/, "doc_handle must include a trailing -suffix"),
} as const;

export function registerTools(server: McpServer, client: MemoriaClient, logger: Logger): void {
  registerSearchTool(server, client, logger);
  registerGetDocumentTool(server, client, logger);
}

function registerSearchTool(server: McpServer, client: MemoriaClient, logger: Logger): void {
  server.registerTool(
    "search_documents",
    {
      title: "Search Memoria documents",
      description:
        "Searches your Memoria workspace documents by slug, title, and tags. Returns up to 10 results.",
      inputSchema: searchInputSchema,
    },
    async ({ query, limit, sort }) => {
      logger.debug("Executing search_documents", { query, limit, sort });

      try {
        const results = await client.searchDocuments({ query, limit, sort });
        const message = formatSearchResults(results);

        return {
          content: [{ type: "text", text: message }],
          structuredContent: { results },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("search_documents error:", message);
        return {
          content: [{ type: "text", text: `Search failed: ${message}` }],
          isError: true,
        };
      }
    },
  );
}

function registerGetDocumentTool(server: McpServer, client: MemoriaClient, logger: Logger): void {
  server.registerTool(
    "get_document",
    {
      title: "Retrieve Memoria document",
      description:
        "Fetches the full body of a Memoria document using its compound slug handle (e.g. design-doc-abc123). Responses are truncated at 800KB.",
      inputSchema: getDocumentInputSchema,
    },
    async ({ doc_handle }) => {
      logger.debug("Executing get_document", doc_handle);

      try {
        const document = await client.getDocument(doc_handle);
        const summary = formatDocumentResponse(doc_handle, document);
        return {
          content: [{ type: "text", text: summary }],
          structuredContent: { document },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("get_document error:", message);
        return {
          content: [{ type: "text", text: `Failed to fetch document: ${message}` }],
          isError: true,
        };
      }
    },
  );
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No documents matched your search.";
  }

  const lines = results.map(
    (result, index) =>
      `${index + 1}. ${result.title} — handle: ${result.doc_handle} (updated: ${new Date(result.updated).toLocaleString()}, approx size: ${formatBytes(result.approx_size)})`,
  );

  return ["Search results:", ...lines].join("\n");
}

function formatDocumentResponse(handle: string, document: DocumentResponse): string {
  const header = `Document "${handle}" (updated: ${new Date(document.updated).toLocaleString()}, full size: ${formatBytes(document.full_size)})`;
  if (document.is_truncated) {
    return `${header}\nWARNING: Response truncated to 800KB.\n\n${document.body}`;
  }
  return `${header}\n\n${document.body}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
