import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("returns expected configuration with debug disabled by default", () => {
    const config = loadConfig({
      CONTEXTOR_PAT: "secret-token",
    });

    expect(config).toEqual({
      apiUrl: "https://benevolent-llama-583.convex.site",
      token: "secret-token",
      debug: false,
    });
  });

  it("parses DEBUG variations into booleans", () => {
    expect(loadConfig({ CONTEXTOR_PAT: "token", DEBUG: "1" }).debug).toBe(true);
    expect(loadConfig({ CONTEXTOR_PAT: "token", DEBUG: "true" }).debug).toBe(true);
    expect(loadConfig({ CONTEXTOR_PAT: "token", DEBUG: "false" }).debug).toBe(false);
  });

  it("throws helpful error when CONTEXTOR_PAT is empty", () => {
    expect(() => loadConfig({ CONTEXTOR_PAT: "" })).toThrow(
      /CONTEXTOR_PAT must be a non-empty personal access token/,
    );
  });

  it("throws error when CONTEXTOR_PAT is missing entirely", () => {
    expect(() => loadConfig({})).toThrow(/Invalid environment configuration/);
  });
});
