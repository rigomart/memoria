import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./utils";

const DOCUMENT_LIMIT = 5;
export const MAX_DOCUMENT_SIZE_BYTES = 800 * 1024;

type ParsedFrontmatter = Record<string, unknown>;

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "") return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  const numericValue = Number(trimmed);
  if (!Number.isNaN(numericValue) && trimmed !== "") {
    return numericValue;
  }

  return trimmed;
}

export function parseFrontmatter(body: string): ParsedFrontmatter {
  const match = body.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new ConvexError("Document must begin with YAML frontmatter enclosed by --- markers.");
  }

  const frontmatterContent = match[1];
  const lines = frontmatterContent.split(/\r?\n/);
  const result: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    if (line.trim() === "") {
      currentArrayKey = null;
      continue;
    }

    if (/^[\s-]/.test(line) && !line.trim().startsWith("-")) {
      throw new ConvexError("Invalid indentation inside frontmatter.");
    }

    if (line.startsWith(" ") || line.startsWith("\t") || line.trim().startsWith("- ")) {
      if (!currentArrayKey) {
        throw new ConvexError("Unexpected indentation or list item without a key.");
      }
      const trimmed = line.trim();
      if (!trimmed.startsWith("- ")) {
        throw new ConvexError(
          `Invalid list item format for "${currentArrayKey}". Use "- value" per line.`,
        );
      }
      const parsed = parseScalar(trimmed.slice(2));
      const existing = result[currentArrayKey];
      if (!Array.isArray(existing)) {
        throw new ConvexError(`Invalid array structure for "${currentArrayKey}".`);
      }
      existing.push(parsed);
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      throw new ConvexError(`Unable to parse frontmatter line: "${line}".`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const valuePart = line.slice(separatorIndex + 1).trim();

    if (valuePart === "") {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;

    if (valuePart.startsWith("[") && valuePart.endsWith("]")) {
      const inner = valuePart.slice(1, -1).trim();
      if (inner === "") {
        result[key] = [];
      } else {
        const items = inner.split(",").map((item) => parseScalar(item.trim()));
        result[key] = items;
      }
      continue;
    }

    result[key] = parseScalar(valuePart);
  }

  return result;
}

export function calculateSize(body: string): number {
  return new TextEncoder().encode(body).length;
}

type FrontmatterFields = {
  title?: unknown;
  tags?: unknown;
  status?: unknown;
  updated?: unknown;
};

type ValidatedFrontmatter = {
  title: string;
  tags: string[];
  status: string;
  updated: number;
};

export function validateAndFillFrontmatter(frontmatter: FrontmatterFields): ValidatedFrontmatter {
  const titleValue = frontmatter.title;
  if (typeof titleValue !== "string" || titleValue.trim().length === 0) {
    throw new ConvexError(
      "Frontmatter must include a non-empty `title` field (e.g. title: My Document).",
    );
  }

  const sanitizedTitle = titleValue.trim();

  const tagsValue = frontmatter.tags;
  let tags: string[] = [];
  if (Array.isArray(tagsValue)) {
    tags = tagsValue
      .map((tag) => {
        if (typeof tag !== "string") {
          throw new ConvexError("Each tag must be a string.");
        }
        return tag.trim();
      })
      .filter((tag) => tag.length > 0);
  } else if (typeof tagsValue === "string" && tagsValue.trim().length > 0) {
    tags = tagsValue
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  const statusValue = frontmatter.status;
  const status =
    typeof statusValue === "string" && statusValue.trim().length > 0 ? statusValue.trim() : "draft";

  const updatedValue = frontmatter.updated;
  let updatedTimestamp = Date.now();
  if (typeof updatedValue === "number" && Number.isFinite(updatedValue)) {
    updatedTimestamp = updatedValue;
  } else if (typeof updatedValue === "string" && updatedValue.trim().length > 0) {
    const parsed = Number(updatedValue);
    if (!Number.isNaN(parsed)) {
      updatedTimestamp = parsed;
    }
  }

  return {
    title: sanitizedTitle,
    tags,
    status,
    updated: updatedTimestamp,
  };
}

export const createDocument = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError("Project not found.");
    }
    if (project.userId !== userId) {
      throw new ConvexError("You do not have permission to add documents to this project.");
    }

    const existingDocs = await ctx.db
      .query("documents")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .take(DOCUMENT_LIMIT + 1);
    if (existingDocs.length >= DOCUMENT_LIMIT) {
      throw new ConvexError("Document limit reached. Each project can have up to 5 documents.");
    }

    const now = Date.now();
    const rawTitle = (args.title ?? "Untitled Document").trim() || "Untitled Document";
    const title = rawTitle.replace(/\r?\n/g, " ").trim();
    const quotedTitle = `"${title.replace(/"/g, '\\"')}"`;
    const initialBody = [
      "---",
      `title: ${quotedTitle}`,
      "tags: []",
      "status: draft",
      `updated: ${now}`,
      "---",
      "",
      "",
    ].join("\n");

    const docId = await ctx.db.insert("documents", {
      projectId: project._id,
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
    revisionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new ConvexError("Document not found.");
    }

    const project = await ctx.db.get(document.projectId);
    if (!project || project.userId !== userId) {
      throw new ConvexError("You do not have permission to edit this document.");
    }

    const size = calculateSize(args.body);
    if (size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ConvexError("Document size exceeds the 800KB limit.");
    }

    let parsed: ParsedFrontmatter;
    try {
      parsed = parseFrontmatter(args.body);
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Unable to parse document frontmatter.");
    }

    const validated = validateAndFillFrontmatter(parsed);

    if (args.revisionToken !== document.revisionToken) {
      throw new ConvexError(
        "Document has been updated elsewhere. Please reload to see the latest version.",
      );
    }

    const nextRevisionToken = crypto.randomUUID();

    await ctx.db.patch(document._id, {
      body: args.body,
      title: validated.title,
      tags: validated.tags,
      status: validated.status,
      updated: validated.updated,
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

    const project = await ctx.db.get(document.projectId);
    if (!project || project.userId !== userId) {
      throw new ConvexError("You do not have permission to delete this document.");
    }

    await ctx.db.delete(document._id);
    return { success: true };
  },
});

export const listProjectDocuments = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new ConvexError("Project not found or inaccessible.");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .collect();

    return documents.sort((a, b) => b.updated - a.updated);
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
    const project = await ctx.db.get(document.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }
    return document;
  },
});
