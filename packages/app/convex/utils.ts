import { ConvexError } from "convex/values";
import slugify from "slugify";

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

// Slugification utilities
export function generateDocumentSlugAndSuffix(
  title: string,
  existingSuffixes: string[],
  currentDocSuffix?: string,
): { slug: string; suffix: string; compoundSlug: string } {
  let baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[^\w\s-]/g,
  });

  // If slug is empty, use a default
  if (!baseSlug) {
    baseSlug = "untitled";
  }

  // Try to generate unique suffix with max 5 attempts
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 8-character suffix using crypto.randomUUID()
    const suffix = crypto.randomUUID().slice(-8).replace(/-/g, "");

    // Check if suffix is available (not used by another doc)
    if (!existingSuffixes.includes(suffix) || suffix === currentDocSuffix) {
      return {
        slug: baseSlug, // Base slug stored in DB: "meeting-notes"
        suffix, // Unique suffix stored in DB: "8a9f4b2c"
        compoundSlug: `${baseSlug}-${suffix}`, // For UI/URLs: "meeting-notes-8a9f4b2c"
      };
    }
  }

  throw new ConvexError("Failed to create your document. Please try again.");
}

// Token management utilities
export function generateToken(): string {
  // Use crypto.randomUUID() for secure token generation
  const token = crypto.randomUUID().replace(/-/g, ""); // Remove dashes for cleaner token
  return `mem_${token}`;
}

export async function hashToken(token: string): Promise<string> {
  // SHA-256 hash using Web Crypto API as specified in the plan
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function validateTokenHash(token: string, hash: string): Promise<boolean> {
  const computedHash = await hashToken(token);
  return computedHash === hash;
}
