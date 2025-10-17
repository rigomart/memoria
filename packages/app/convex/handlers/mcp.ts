import { api, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

export const mcpSearch = httpAction(async (ctx, request) => {
  try {
    // Extract PAT from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing or invalid Authorization header. Use: Authorization: Bearer {token}" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const tokenValidation = await ctx.runQuery(internal.tokens.validateToken, {
      plainToken: token,
    });

    if (!tokenValidation) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Update lastUsedAt asynchronously (fire and forget)
    ctx
      .runMutation(internal.tokens.updateTokenLastUsed, {
        tokenId: tokenValidation.tokenId,
      })
      .catch(console.error);

    // Parse request body
    const requestBody = await request.json();
    const { q, top_k, sort } = requestBody;

    if (!q || typeof q !== "string") {
      return Response.json({ error: "Missing or invalid 'q' parameter" }, { status: 400 });
    }

    // Call searchDocuments query for authenticated user
    const searchResults = await ctx.runQuery(api.documents.searchDocuments, {
      q,
      top_k: typeof top_k === "number" ? top_k : undefined,
      sort: sort === "recency" || sort === "relevance" ? sort : undefined,
    });

    // Return results in MCP format
    const mcpResults = searchResults.map((doc) => ({
      doc_handle: doc.compoundSlug, // Use compound slug as document handle
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
    // Extract PAT from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing or invalid Authorization header. Use: Authorization: Bearer {token}" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const tokenValidation = await ctx.runQuery(internal.tokens.validateToken, {
      plainToken: token,
    });

    if (!tokenValidation) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Update lastUsedAt asynchronously (fire and forget)
    ctx
      .runMutation(internal.tokens.updateTokenLastUsed, {
        tokenId: tokenValidation.tokenId,
      })
      .catch(console.error);

    // Parse request body
    const requestBody = await request.json();
    const { doc_handle, max_bytes } = requestBody;

    if (!doc_handle || typeof doc_handle !== "string") {
      return Response.json({ error: "Missing or invalid 'doc_handle' parameter" }, { status: 400 });
    }

    // Extract suffix from compound slug (last 8 chars after last dash)
    const lastDashIndex = doc_handle.lastIndexOf("-");
    if (lastDashIndex === -1 || lastDashIndex === doc_handle.length - 1) {
      return Response.json({ error: "Invalid document handle format" }, { status: 400 });
    }

    const suffix = doc_handle.slice(lastDashIndex + 1);

    // Set size limits (default 64KB, max 800KB as per plan)
    const defaultMaxBytes = 64 * 1024; // 64KB
    const absoluteMaxBytes = 800 * 1024; // 800KB
    const requestedMaxBytes =
      max_bytes && typeof max_bytes === "number" ? max_bytes : defaultMaxBytes;
    const finalMaxBytes = Math.min(requestedMaxBytes, absoluteMaxBytes);

    // Get document by suffix
    const document = await ctx.runQuery(api.documents.getDocumentBySuffix, { suffix });

    if (!document || !document.body) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if document content needs to be truncated
    const bodyBytes = new TextEncoder().encode(document.body).length;
    const isTruncated = bodyBytes > finalMaxBytes;
    let bodyForResponse = document.body;

    if (isTruncated) {
      // Truncate by bytes, not characters, to ensure within limit
      const encoder = new TextEncoder();
      const bodyArray = encoder.encode(document.body);
      const truncatedArray = bodyArray.slice(0, finalMaxBytes);
      bodyForResponse = new TextDecoder().decode(truncatedArray);
    }

    // Parse frontmatter (simple implementation - assumes YAML frontmatter with ---)
    let frontmatter = "";
    let body = bodyForResponse;

    if (body.startsWith("---\n")) {
      const endOfFrontmatter = body.indexOf("\n---\n", 4);
      if (endOfFrontmatter !== -1) {
        frontmatter = body.slice(4, endOfFrontmatter);
        body = body.slice(endOfFrontmatter + 5);
      }
    }

    return Response.json({
      frontmatter,
      body,
      updated: document.updated,
      full_size: bodyBytes,
      is_truncated: isTruncated,
    });
  } catch (error) {
    console.error("MCP get_document error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
