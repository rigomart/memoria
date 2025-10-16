import { ConvexError } from "convex/values";

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

export async function requireUserId(ctx: AuthContext): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be signed in to perform this action.");
  }
  return identity.subject;
}
