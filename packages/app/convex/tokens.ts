import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { generateToken, hashToken, requireUserId } from "./utils";

const MAX_TOKENS_PER_USER = 10;

export const createToken = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new ConvexError("Token name is required.");
    }

    const existingTokens = await ctx.db
      .query("tokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(MAX_TOKENS_PER_USER + 1);

    if (existingTokens.length >= MAX_TOKENS_PER_USER) {
      throw new ConvexError(
        `You can have up to ${MAX_TOKENS_PER_USER} tokens. Please delete some existing tokens first.`,
      );
    }

    const plainToken = generateToken();
    const tokenHash = await hashToken(plainToken);

    const now = Date.now();
    const tokenId = await ctx.db.insert("tokens", {
      userId,
      tokenHash,
      name: trimmedName,
      createdAt: now,
    });

    return {
      _id: tokenId,
      token: plainToken,
      name: trimmedName,
      createdAt: now,
    };
  },
});

export const listUserTokens = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return tokens.map((token) => ({
      _id: token._id,
      name: token.name,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
    }));
  },
});

export const deleteToken = mutation({
  args: {
    tokenId: v.id("tokens"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const token = await ctx.db.get(args.tokenId);
    if (!token) {
      throw new ConvexError("Token not found.");
    }

    if (token.userId !== userId) {
      throw new ConvexError("You do not have permission to delete this token.");
    }

    await ctx.db.delete(args.tokenId);
    return { success: true };
  },
});

// Internal query to validate token and get userId
export const validateToken = internalQuery({
  args: {
    plainToken: v.string(),
  },
  handler: async (ctx, args) => {
    const plainToken = args.plainToken.trim();
    if (!plainToken) {
      return null;
    }

    const tokenHash = await hashToken(plainToken);
    const token = await ctx.db
      .query("tokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!token) {
      return null;
    }

    return {
      userId: token.userId,
      tokenId: token._id,
    };
  },
});

// Internal mutation to update token lastUsedAt
export const updateTokenLastUsed = internalMutation({
  args: {
    tokenId: v.id("tokens"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, {
      lastUsedAt: Date.now(),
    });
  },
});
