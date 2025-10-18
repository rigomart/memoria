import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    userId: v.string(),
    title: v.string(),
    slug: v.string(), // Base slug: "meeting-notes"
    suffix: v.string(), // Unique identifier: "8a9f4b2c"
    body: v.string(),
    tags: v.array(v.string()),
    updated: v.number(),
    sizeBytes: v.number(),
    createdAt: v.number(),
    revisionToken: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_updated", ["userId", "updated"])
    .index("by_suffix", ["suffix"]),

  tokens: defineTable({
    userId: v.string(),
    tokenHash: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_tokenHash", ["tokenHash"]),
});
