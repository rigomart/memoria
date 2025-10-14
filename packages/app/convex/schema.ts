import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    handle: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_handle", ["handle"]),
  documents: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    status: v.string(),
    updated: v.number(),
    sizeBytes: v.number(),
    createdAt: v.number(),
    revisionToken: v.string(),
  }).index("by_projectId", ["projectId"]),
});
