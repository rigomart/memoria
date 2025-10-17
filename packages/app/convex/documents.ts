import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateDocumentSlugAndSuffix, requireUserId } from "./utils";

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

    const docId = await ctx.db.insert("documents", {
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

    return await ctx.db.get(docId);
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
      // Get all user's existing documents for collision detection (excluding current doc)
      const userDocs = await ctx.db
        .query("documents")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      const existingSuffixes = userDocs
        .filter((doc) => doc._id !== document._id) // Exclude current doc
        .map((doc) => doc.suffix)
        .filter(Boolean);

      const generated = generateDocumentSlugAndSuffix(
        trimmedTitle,
        existingSuffixes,
        document.suffix,
      );
      slug = generated.slug;
      suffix = generated.suffix;
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
    const document = await ctx.db
      .query("documents")
      .withIndex("by_suffix", (q) => q.eq("suffix", args.suffix))
      .first();

    if (!document || document.userId !== userId) {
      return null;
    }

    return document;
  },
});

export const searchDocuments = query({
  args: {
    q: v.string(),
    top_k: v.optional(v.number()),
    sort: v.optional(v.union(v.literal("relevance"), v.literal("recency"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const topK = Math.min(args.top_k ?? 5, 10); // Default 5, max 10
    const sort = args.sort ?? "relevance";

    // Get all user's documents (max 10 per user for performance)
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_userId_updated", (q) => q.eq("userId", userId))
      .take(10);

    if (!args.q.trim()) {
      // Return most recent if no query
      return documents
        .sort((a, b) => b.updated - a.updated)
        .slice(0, topK)
        .map((doc) => ({
          _id: doc._id,
          compoundSlug: `${doc.slug}-${doc.suffix}`, // For UI/URLs
          title: doc.title,
          updated: doc.updated,
          sizeBytes: doc.sizeBytes,
        }));
    }

    // Normalize query and split into tokens
    const queryTokens = args.q
      .toLowerCase()
      .split(/[-\s]+/)
      .filter((token) => token.length > 0);

    // Score and filter documents
    const scoredDocs = documents
      .filter((doc) => {
        const compoundSlug = `${doc.slug}-${doc.suffix}`.toLowerCase();
        const slugTokens = compoundSlug.split(/[-\s]+/);
        // ALL query tokens must appear in slug tokens (AND behavior)
        return queryTokens.every((qToken) =>
          slugTokens.some((slugToken) => slugToken.includes(qToken)),
        );
      })
      .map((doc) => {
        const compoundSlug = `${doc.slug}-${doc.suffix}`.toLowerCase();
        let score = 0;

        // Ranking: exact match (1000) > starts-with (500) > contains (100)
        if (compoundSlug === args.q.toLowerCase()) {
          score = 1000;
        } else if (compoundSlug.startsWith(args.q.toLowerCase())) {
          score = 500;
        } else {
          score = 100;
        }

        return {
          _id: doc._id,
          compoundSlug: `${doc.slug}-${doc.suffix}`, // For UI/URLs
          title: doc.title,
          updated: doc.updated,
          sizeBytes: doc.sizeBytes,
          score,
        };
      });

    // Sort by score then by compound slug for tie-breaking
    scoredDocs.sort((a, b) => {
      if (sort === "recency") {
        return b.updated - a.updated;
      }
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.compoundSlug.localeCompare(b.compoundSlug); // Stable tiebreak by compound slug
    });

    return scoredDocs.slice(0, topK);
  },
});
