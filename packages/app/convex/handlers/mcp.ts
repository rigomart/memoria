import { z } from "zod/v3";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, httpAction } from "../_generated/server";

const BEARER_PREFIX = "Bearer ";
const ABSOLUTE_MAX_BYTES = 800 * 1024;

const searchRequestSchema = z.object({
  query: z.string().trim().min(1, "Missing or invalid 'query' parameter."),
  limit: z.number().int().positive().max(10).optional(),
  sort: z.enum(["recency", "relevance"]).optional(),
});

const docHandleSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      const lastDashIndex = value.lastIndexOf("-");
      return lastDashIndex > 0 && lastDashIndex < value.length - 1;
    },
    { message: "Invalid document handle format." },
  );

const getDocumentRequestSchema = z.object({
  doc_handle: docHandleSchema,
});

type AuthenticatedToken = {
  userId: string;
  tokenId: Id<"tokens">;
};

type AuthResult = { ok: true; token: AuthenticatedToken } | { ok: false; response: Response };

const unauthorized = (message: string) => Response.json({ error: message }, { status: 401 });

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

function validationError(error: z.ZodError) {
  const message = error.issues[0]?.message ?? "Invalid request body.";
  return badRequest(message);
}

function extractSuffix(handle: string): string {
  return handle.slice(handle.lastIndexOf("-") + 1);
}

async function authenticateRequest(ctx: ActionCtx, request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return {
      ok: false,
      response: unauthorized(
        "Missing or invalid Authorization header. Use: Authorization: Bearer {token}",
      ),
    };
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    return { ok: false, response: unauthorized("Token is missing or empty.") };
  }

  const tokenInfo = await ctx.runQuery(internal.tokens.validateToken, {
    plainToken: token,
  });

  if (!tokenInfo) {
    return { ok: false, response: unauthorized("Invalid or expired token.") };
  }

  return { ok: true, token: tokenInfo };
}

async function updateTokenLastUsed(ctx: ActionCtx, tokenId: Id<"tokens">) {
  try {
    await ctx.runMutation(internal.tokens.updateTokenLastUsed, { tokenId });
  } catch (error) {
    console.error("Failed to update token lastUsedAt:", error);
  }
}

export const mcpSearch = httpAction(async (ctx, request) => {
  try {
    const auth = await authenticateRequest(ctx, request);
    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    void updateTokenLastUsed(ctx, auth.token.tokenId);

    const searchResults = await ctx.runQuery(internal.documents.searchDocumentsForUser, {
      userId: auth.token.userId,
      query: parsed.data.query,
      limit: parsed.data.limit,
      sort: parsed.data.sort,
    });

    const mcpResults = searchResults.map((doc) => ({
      doc_handle: doc.compoundSlug,
      title: doc.title,
      updated: doc.updated,
      approx_size: doc.sizeBytes,
    }));

    return Response.json(mcpResults);
  } catch (error) {
    console.error("MCP search error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const mcpGetDocument = httpAction(async (ctx, request) => {
  try {
    const auth = await authenticateRequest(ctx, request);
    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const parsed = getDocumentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { doc_handle } = parsed.data;
    const suffix = extractSuffix(doc_handle);

    void updateTokenLastUsed(ctx, auth.token.tokenId);

    const document = await ctx.runQuery(internal.documents.getDocumentBySuffixForUser, {
      userId: auth.token.userId,
      suffix,
    });

    if (!document || !document.body) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(document.body);
    const isTruncated = bodyBytes.length > ABSOLUTE_MAX_BYTES;
    const truncatedBytes = isTruncated ? bodyBytes.slice(0, ABSOLUTE_MAX_BYTES) : bodyBytes;
    const bodyForResponse = new TextDecoder().decode(truncatedBytes);

    return Response.json({
      body: bodyForResponse,
      updated: document.updated,
      full_size: bodyBytes.length,
      is_truncated: isTruncated,
    });
  } catch (error) {
    console.error("MCP get_document error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
