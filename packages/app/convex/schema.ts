import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    updated: v.number(),
    sizeBytes: v.number(),
    createdAt: v.number(),
    revisionToken: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_updated", ["userId", "updated"]),
});
