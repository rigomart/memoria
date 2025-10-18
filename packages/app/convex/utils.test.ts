import { afterEach, describe, expect, it, vi } from "vitest";
import { generateDocumentSlug, generateDocumentSlugAndSuffix } from "./utils";

const makeUuid = (suffix: string): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-0000${suffix}`;

describe("generateDocumentSlug", () => {
  it("slugifies titles using lowercase kebab-case", () => {
    expect(generateDocumentSlug("Project Status Update")).toBe("project-status-update");
  });

  it("falls back to 'untitled' when slugify removes all characters", () => {
    expect(generateDocumentSlug("???")).toBe("untitled");
  });
});

describe("generateDocumentSlugAndSuffix", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries until it finds a suffix not already in use", () => {
    const randomUuid = vi.spyOn(crypto, "randomUUID");
    randomUuid.mockReturnValueOnce(makeUuid("abcd1234")).mockReturnValueOnce(makeUuid("ef901234"));

    const result = generateDocumentSlugAndSuffix("Design Review", ["abcd1234"]);

    expect(result.slug).toBe("design-review");
    expect(result.suffix).toBe("ef901234");
  });

  it("allows reusing the current suffix when updating a document", () => {
    const randomUuid = vi.spyOn(crypto, "randomUUID");
    randomUuid.mockReturnValueOnce(makeUuid("abcd1234"));

    const result = generateDocumentSlugAndSuffix("Design Review", ["abcd1234"], "abcd1234");

    expect(result.slug).toBe("design-review");
    expect(result.suffix).toBe("abcd1234");
  });
});
