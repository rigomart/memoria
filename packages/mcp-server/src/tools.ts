import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DocumentResponse, MemoriaClient, SearchResult } from "./client.js";
import type { Logger } from "./logger.js";

const searchInputParams = {
  query: z.string().min(1, "query must be at least one character long").max(200),
  limit: z.number().int().min(1).max(10).optional(),
  sort: z.enum(["relevance", "recency"]).optional(),
} satisfies Record<string, z.ZodTypeAny>;

const searchInputSchema = z.object(searchInputParams).strict();

const getDocumentInputParams = {
  doc_handle: z
    .string()
    .min(3, "doc_handle must include a slug and suffix (e.g. design-doc-abc123)")
    .regex(/.+-.+/, "doc_handle must include a trailing -suffix"),
} satisfies Record<string, z.ZodTypeAny>;

const getDocumentInputSchema = z.object(getDocumentInputParams).strict();

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
      inputSchema: searchInputParams,
    },
    async (rawInput) => {
      logger.debug("Executing search_documents", rawInput);

      const parsedInput = searchInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        const message = formatValidationError(parsedInput.error);
        logger.warn("search_documents validation error:", message);
        return {
          content: [{ type: "text", text: `Invalid search input: ${message}` }],
          isError: true,
        };
      }

      const { query, limit, sort } = parsedInput.data;

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
      inputSchema: getDocumentInputParams,
    },
    async (rawInput) => {
      logger.debug("Executing get_document", rawInput);

      const parsedInput = getDocumentInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        const message = formatValidationError(parsedInput.error);
        logger.warn("get_document validation error:", message);
        return {
          content: [{ type: "text", text: `Invalid document handle: ${message}` }],
          isError: true,
        };
      }

      const { doc_handle } = parsedInput.data;

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

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "input";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
