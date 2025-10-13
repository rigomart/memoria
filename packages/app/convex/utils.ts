/**
 * Convert a project name into a URL-safe handle and append a timestamp for uniqueness.
 * The timestamp ensures users can reuse the same base name without collisions.
 */
export function generateProjectHandle(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = normalized.length > 0 ? normalized : "project";
  const suffix = Math.floor(Date.now() / 1000).toString(36);
  return `${base}-${suffix}`;
}
