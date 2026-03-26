import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { LangfuseClient } from "../../langfuse/client.js";

function createFeedTestApp() {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    listTraces: async (limit: number) => ({
      data: [
        {
          id: "trace-1",
          timestamp: "2024-01-15T12:00:00Z",
          name: "chat-completion",
          userId: "alice@company.com",
          latency: 1.2,
          totalCost: 0.05,
          metadata: { account_id: "acme" },
          observations: [{ model: "gpt-4o", level: "DEFAULT" }],
        },
        {
          id: "trace-2",
          timestamp: "2024-01-15T11:59:50Z",
          name: "summarize",
          userId: "bob@company.com",
          latency: 2.5,
          totalCost: 0.12,
          metadata: null,
          observations: [{ model: "claude-sonnet-4-20250514", level: "ERROR" }],
        },
      ].slice(0, limit),
    }),
    healthCheck: async () => true,
  } as LangfuseClient;

  const cache = new InMemoryCache();
  return { app: createApp({ langfuse, cache, boardConfig: DEFAULT_CONFIG }), cache };
}

describe("GET /api/feed", () => {
  it("returns feed items with correct shape", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(2);

    const first = body.items[0];
    expect(first.id).toBe("trace-1");
    expect(first.userId).toBe("alice@company.com");
    expect(first.name).toBe("chat-completion");
    expect(first.model).toBe("gpt-4o");
    expect(first.latencyMs).toBe(1200);
    expect(first.cost).toBe(0.05);
    expect(first.status).toBe("success");
  });

  it("detects error status from observations", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed");
    const body = await res.json();

    expect(body.items[1].status).toBe("error");
  });

  it("respects limit parameter", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed?limit=1");
    const body = await res.json();

    expect(body.items).toHaveLength(1);
  });
});
