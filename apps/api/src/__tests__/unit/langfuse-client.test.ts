import { describe, it, expect, vi, beforeEach } from "vitest";
import { LangfuseClient } from "../../langfuse/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("LangfuseClient", () => {
  let client: LangfuseClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new LangfuseClient({
      host: "https://cloud.langfuse.com",
      publicKey: "pk-test",
      secretKey: "sk-test",
    });
  });

  it("sends Basic Auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await client.queryMetrics({
      view: "traces",
      metrics: [{ measure: "count", aggregation: "count" }],
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    });

    const [url, options] = mockFetch.mock.calls[0]!;
    expect(url).toContain("https://cloud.langfuse.com/api/public/metrics");
    expect(options.headers["Authorization"]).toMatch(/^Basic /);

    const decoded = atob(options.headers["Authorization"].replace("Basic ", ""));
    expect(decoded).toBe("pk-test:sk-test");
  });

  it("passes query as URL-encoded JSON parameter", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ count: 42 }] }),
    });

    const result = await client.queryMetrics({
      view: "traces",
      metrics: [{ measure: "count", aggregation: "count" }],
      fromTimestamp: "2024-01-01T00:00:00Z",
      toTimestamp: "2024-01-31T23:59:59Z",
    });

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toContain("query=");
    expect(result.data).toEqual([{ count: 42 }]);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve("Invalid API key"),
    });

    await expect(
      client.queryMetrics({
        view: "traces",
        metrics: [{ measure: "count", aggregation: "count" }],
        fromTimestamp: "2024-01-01T00:00:00Z",
        toTimestamp: "2024-01-31T23:59:59Z",
      }),
    ).rejects.toThrow("Langfuse API error 401");
  });

  it("throws on 429 with rate limit info", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: () => Promise.resolve("Rate limited"),
      headers: new Headers({ "Retry-After": "60" }),
    });

    await expect(
      client.queryMetrics({
        view: "traces",
        metrics: [{ measure: "count", aggregation: "count" }],
        fromTimestamp: "2024-01-01T00:00:00Z",
        toTimestamp: "2024-01-31T23:59:59Z",
      }),
    ).rejects.toThrow("Rate limited");
  });

  it("health check calls the health endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: "OK" }),
    });

    const result = await client.healthCheck();
    expect(result).toBe(true);

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe("https://cloud.langfuse.com/api/public/health");
  });

  it("health check returns false on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await client.healthCheck();
    expect(result).toBe(false);
  });
});
