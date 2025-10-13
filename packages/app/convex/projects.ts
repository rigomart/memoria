import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateProjectHandle, requireUserId } from "./utils";

const PROJECT_LIMIT = 2;

export const createProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const trimmedName = args.name.trim();
    if (trimmedName.length === 0) {
      throw new ConvexError("Project name cannot be empty.");
    }

    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(PROJECT_LIMIT + 1);

    if (existingProjects.length >= PROJECT_LIMIT) {
      throw new ConvexError("Project limit reached. You can only have 2 projects.");
    }

    const now = Date.now();
    let handle = generateProjectHandle(trimmedName);

    // Ensure the handle is unique by regenerating if needed.
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const existingHandleMatch = await ctx.db
        .query("projects")
        .withIndex("by_handle", (q) => q.eq("handle", handle))
        .first();

      if (!existingHandleMatch) {
        break;
      }

      handle = generateProjectHandle(trimmedName);
      if (attempts === 4) {
        throw new ConvexError("Failed to generate a unique project handle. Please try again.");
      }
    }

    const projectId = await ctx.db.insert("projects", {
      userId,
      name: trimmedName,
      handle,
      createdAt: now,
    });

    return await ctx.db.get(projectId);
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new ConvexError("Project not found.");
    }

    if (project.userId !== userId) {
      throw new ConvexError("You do not have permission to delete this project.");
    }

    const relatedDocuments = await ctx.db
      .query("documents")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .collect();

    await Promise.all(relatedDocuments.map((doc) => ctx.db.delete(doc._id)));

    await ctx.db.delete(project._id);
    return { success: true };
  },
});

export const listUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return projects.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getProjectByHandle = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db
      .query("projects")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();

    if (!project || project.userId !== userId) {
      return null;
    }

    return project;
  },
});
