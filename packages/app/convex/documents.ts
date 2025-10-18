import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalQuery, mutation, type QueryCtx, query } from "./_generated/server";
import { generateDocumentSlug, generateDocumentSlugAndSuffix, requireUserId } from "./utils";

const DOCUMENT_LIMIT = 10;
export const MAX_DOCUMENT_SIZE_BYTES = 800 * 1024;

export function calculateSize(body: string): number {
  return new TextEncoder().encode(body).length;
}

export const createDocument = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existingDocs = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(DOCUMENT_LIMIT + 1);
    if (existingDocs.length >= DOCUMENT_LIMIT) {
      throw new ConvexError("Document limit reached. You can have up to 10 documents.");
    }

    const now = Date.now();
    const title = (args.title ?? "Untitled Document").trim() || "Untitled Document";
    const initialBody = "";

    // Get existing suffixes for collision detection
    const existingSuffixes = existingDocs.map((doc) => doc.suffix).filter(Boolean);

    // Generate slug and suffix for new document
    const { slug, suffix } = generateDocumentSlugAndSuffix(title, existingSuffixes);

    await ctx.db.insert("documents", {
      userId,
      title,
      slug,
      suffix,
      body: initialBody,
      tags: [],
      updated: now,
      sizeBytes: calculateSize(initialBody),
      createdAt: now,
      revisionToken: crypto.randomUUID(),
    });
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    body: v.string(),
    title: v.string(),
    tags: v.array(v.string()),
    revisionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new ConvexError("Document not found.");
    }

    if (document.userId !== userId) {
      throw new ConvexError("You do not have permission to edit this document.");
    }

    const size = calculateSize(args.body);
    if (size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ConvexError("Document size exceeds the 800KB limit.");
    }

    if (args.revisionToken !== document.revisionToken) {
      throw new ConvexError(
        "Document has been updated elsewhere. Please reload to see the latest version.",
      );
    }

    const nextRevisionToken = crypto.randomUUID();
    const now = Date.now();

    // Check if title changed and regenerate slug if needed
    const trimmedTitle = args.title.trim();
    let slug = document.slug;
    let suffix = document.suffix;

    if (trimmedTitle !== document.title) {
      slug = generateDocumentSlug(trimmedTitle);
      // Preserve the original suffix so existing document handles continue working.
      suffix = document.suffix;
    }

    await ctx.db.patch(document._id, {
      body: args.body,
      title: trimmedTitle,
      slug,
      suffix,
      tags: args.tags,
      updated: now,
      sizeBytes: size,
      revisionToken: nextRevisionToken,
    });

    return await ctx.db.get(document._id);
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new ConvexError("Document not found.");
    }

    if (document.userId !== userId) {
      throw new ConvexError("You do not have permission to delete this document.");
    }

    await ctx.db.delete(document._id);
    return { success: true };
  },
});

export const listUserDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_userId_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }
    if (document.userId !== userId) {
      return null;
    }
    return document;
  },
});

export const getDocumentBySuffix = query({
  args: {
    suffix: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return getDocumentBySuffixInternal(ctx, { userId, suffix: args.suffix });
  },
});

export const searchDocuments = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    sort: v.optional(v.union(v.literal("relevance"), v.literal("recency"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return searchDocumentsInternal(ctx, {
      userId,
      query: args.query,
      limit: args.limit,
      sort: args.sort,
    });
  },
});

export const getDocumentBySuffixForUser = internalQuery({
  args: {
    userId: v.string(),
    suffix: v.string(),
  },
  handler: async (ctx, args) => getDocumentBySuffixInternal(ctx, args),
});

export const searchDocumentsForUser = internalQuery({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    sort: v.optional(v.union(v.literal("relevance"), v.literal("recency"))),
  },
  handler: async (ctx, args) => searchDocumentsInternal(ctx, args),
});

type GetDocumentBySuffixParams = {
  userId: string;
  suffix: string;
};

type SearchDocumentsParams = {
  userId: string;
  query: string;
  limit?: number;
  sort?: "relevance" | "recency";
};

type RankedDocument = {
  _id: Doc<"documents">["_id"];
  compoundSlug: string;
  title: string;
  updated: number;
  sizeBytes: number;
  score: number;
};

async function getDocumentBySuffixInternal(
  ctx: QueryCtx,
  { userId, suffix }: GetDocumentBySuffixParams,
) {
  const document = await ctx.db
    .query("documents")
    .withIndex("by_suffix", (q) => q.eq("suffix", suffix))
    .first();

  if (!document || document.userId !== userId) {
    return null;
  }

  return document;
}

async function searchDocumentsInternal(ctx: QueryCtx, args: SearchDocumentsParams) {
  const limit = Math.min(args.limit ?? 5, DOCUMENT_LIMIT);
  const sort = args.sort ?? "relevance";

  const documents = await ctx.db
    .query("documents")
    .withIndex("by_userId_updated", (q) => q.eq("userId", args.userId))
    .take(DOCUMENT_LIMIT);

  const trimmedQuery = args.query.trim();
  if (!trimmedQuery) {
    return documents
      .sort((a, b) => b.updated - a.updated)
      .slice(0, limit)
      .map((doc) => ({
        _id: doc._id,
        compoundSlug: `${doc.slug}-${doc.suffix}`,
        title: doc.title,
        updated: doc.updated,
        sizeBytes: doc.sizeBytes,
      }));
  }

  const normalizedQuery = trimmedQuery.toLowerCase();
  const queryTokens = normalizedQuery.split(/[-\s]+/).filter((token) => token.length > 0);

  const scoredDocs: RankedDocument[] = [];

  for (const doc of documents) {
    const scored = scoreDocument(doc, queryTokens);
    if (scored) {
      scoredDocs.push(scored);
    }
  }

  scoredDocs.sort((a, b) => {
    if (sort === "recency") {
      return b.updated - a.updated;
    }
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.updated !== b.updated) {
      return b.updated - a.updated;
    }
    return a.compoundSlug.localeCompare(b.compoundSlug);
  });

  return scoredDocs.slice(0, limit).map(({ score: _score, ...doc }) => doc);
}

function scoreDocument(doc: Doc<"documents">, queryTokens: string[]): RankedDocument | null {
  const compoundSlug = `${doc.slug}-${doc.suffix}`;
  const slugLower = compoundSlug.toLowerCase();
  const titleLower = doc.title.toLowerCase();
  const tagsLower = doc.tags.map((tag) => tag.toLowerCase());

  let score = 0;

  for (const token of queryTokens) {
    let matched = false;

    if (slugLower === token) {
      score += 100;
      matched = true;
    } else if (slugLower.startsWith(token)) {
      score += 60;
      matched = true;
    } else if (slugLower.includes(token)) {
      score += 30;
      matched = true;
    }

    if (titleLower === token) {
      score += 50;
      matched = true;
    } else if (titleLower.startsWith(token)) {
      score += 25;
      matched = true;
    } else if (titleLower.includes(token)) {
      score += 10;
      matched = true;
    }

    const tagMatch = tagsLower.find((tag) => tag === token || tag.includes(token));
    if (tagMatch) {
      score += tagMatch === token ? 15 : 10;
      matched = true;
    }

    if (!matched) {
      return null;
    }

    score += 5;
  }

  return {
    _id: doc._id,
    compoundSlug,
    title: doc.title,
    updated: doc.updated,
    sizeBytes: doc.sizeBytes,
    score,
  };
}
