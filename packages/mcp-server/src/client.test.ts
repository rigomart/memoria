import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoriaClient } from "./client.js";
import type { AppConfig } from "./config.js";
import type { Logger } from "./logger.js";

const config: AppConfig = {
  apiUrl: "https://api.example.com",
  token: "token-123",
  debug: false,
};

function createLoggerMock(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe("MemoriaClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("searchDocuments sends authenticated request and returns validated results", async () => {
    const responseBody = [
      { doc_handle: "doc-123", title: "Doc Title", updated: 1_700_000_000_000, approx_size: 1024 },
    ];
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new MemoriaClient(config, createLoggerMock());
    const results = await client.searchDocuments({ query: "status", limit: 3, sort: "relevance" });

    expect(results).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/mcp/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as Parameters<typeof fetch>;
    const parsedBody = JSON.parse((requestInit?.body as string) ?? "");
    expect(parsedBody).toEqual({ query: "status", limit: 3, sort: "relevance" });
  });

  it("throws error when API response is not ok", async () => {
    fetchMock.mockResolvedValue(
      new Response("server exploded", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const client = new MemoriaClient(config, createLoggerMock());

    await expect(client.searchDocuments({ query: "fail" })).rejects.toThrow(
      /Memoria API request failed \(500 Internal Server Error\): server exploded/,
    );
  });

  it("throws error when response payload fails validation", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ title: "missing fields" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new MemoriaClient(config, createLoggerMock());

    await expect(client.searchDocuments({ query: "bad-data" })).rejects.toThrow(
      /Unexpected response from Memoria API/,
    );
  });

  it("getDocument returns validated document response", async () => {
    const responseBody = {
      body: "Hello world",
      updated: 1_700_000_000_000,
      full_size: 2048,
      is_truncated: false,
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new MemoriaClient(config, createLoggerMock());
    const document = await client.getDocument("doc-handle");

    expect(document).toEqual(responseBody);
    const [, requestInit] = fetchMock.mock.calls[0] as Parameters<typeof fetch>;
    const parsedBody = JSON.parse((requestInit?.body as string) ?? "");
    expect(parsedBody).toEqual({ doc_handle: "doc-handle" });
  });

  it("verifyConnection delegates to searchDocuments and bubbles up errors", async () => {
    const client = new MemoriaClient(config, createLoggerMock());
    const searchSpy = vi.spyOn(client, "searchDocuments").mockResolvedValue([]);

    await expect(client.verifyConnection()).resolves.toBeUndefined();
    expect(searchSpy).toHaveBeenCalledWith({ query: "ping", limit: 1 });

    searchSpy.mockRejectedValueOnce(new Error("down"));
    await expect(client.verifyConnection()).rejects.toThrow(
      "Failed to verify Memoria MCP connectivity: down",
    );
  });
});
