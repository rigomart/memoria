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
    const suffix = crypto.randomUUID().slice(-8).replace(/-/g, "");

    // Check if suffix is available (not used by another doc)
    if (!existingSuffixes.includes(suffix) || suffix === currentDocSuffix) {
      return {
        slug: baseSlug,
        suffix,
        compoundSlug: `${baseSlug}-${suffix}`, // For UI/URLs: "meeting-notes-8a9f4b2c"
      };
    }
  }

  throw new ConvexError("Failed to create your document suffix. Please try again.");
}

// Token management utilities
export function generateToken(byteLength = 32): string {
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `mem_${token}`;
}

export async function hashToken(token: string): Promise<string> {
  const hashBytes = await computeTokenHashBytes(token);
  return toHex(hashBytes);
}

export async function validateTokenHash(token: string, expectedHash: string): Promise<boolean> {
  try {
    const expectedBytes = fromHex(expectedHash);
    const computedBytes = await computeTokenHashBytes(token);
    if (computedBytes.length !== expectedBytes.length) {
      return false;
    }
    let mismatch = 0;
    for (let index = 0; index < computedBytes.length; index++) {
      mismatch |= computedBytes[index] ^ expectedBytes[index];
    }
    return mismatch === 0;
  } catch {
    // Reject tokens if the stored hash is malformed.
    return false;
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length.");
  }
  const output = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error("Invalid hex string.");
    }
    output[i / 2] = byte;
  }
  return output;
}

async function computeTokenHashBytes(token: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}
