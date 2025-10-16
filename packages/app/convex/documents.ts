import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./utils";

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

    const docId = await ctx.db.insert("documents", {
      userId,
      title,
      body: initialBody,
      tags: [],
      status: "draft",
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
    status: v.string(),
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

    await ctx.db.patch(document._id, {
      body: args.body,
      title: args.title.trim(),
      tags: args.tags,
      status: args.status.trim(),
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
