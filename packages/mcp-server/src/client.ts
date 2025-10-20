import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { Logger } from "./logger.js";

const searchResultSchema = z.object({
  doc_handle: z.string(),
  title: z.string(),
  updated: z.number(),
  approx_size: z.number(),
});

const searchResponseSchema = z.array(searchResultSchema);

const getDocumentResponseSchema = z.object({
  body: z.string(),
  updated: z.number(),
  full_size: z.number(),
  is_truncated: z.boolean(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type DocumentResponse = z.infer<typeof getDocumentResponseSchema>;

type SearchArgs = {
  query: string;
  limit?: number;
  sort?: "relevance" | "recency";
};

export class MemoriaClient {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  async verifyConnection(): Promise<void> {
    try {
      await this.searchDocuments({ query: "ping", limit: 1 });
      this.logger.debug("Verified Memoria MCP connectivity.");
    } catch (error) {
      throw new Error(`Failed to verify Memoria MCP connectivity: ${(error as Error).message}`);
    }
  }

  async searchDocuments(args: SearchArgs): Promise<SearchResult[]> {
    const payload: Record<string, unknown> = {
      query: args.query,
    };
    if (typeof args.limit === "number") {
      payload.limit = args.limit;
    }
    if (args.sort) {
      payload.sort = args.sort;
    }

    const response = await this.post("/mcp/search", payload, searchResponseSchema);
    return response;
  }

  async getDocument(docHandle: string): Promise<DocumentResponse> {
    const response = await this.post(
      "/mcp/get_document",
      { doc_handle: docHandle },
      getDocumentResponseSchema,
    );
    return response;
  }

  private async post<T>(path: string, body: unknown, schema: z.Schema<T>): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    this.logger.debug("POST", url, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(
        `Memoria API request failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const data = await response.json();
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(`Unexpected response from Memoria API: ${parseResult.error.message}`);
    }
    return parseResult.data;
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<unreadable>";
  }
}
