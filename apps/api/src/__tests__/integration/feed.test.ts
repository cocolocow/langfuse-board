import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import type { ILangfuseClient } from "../../langfuse/client.js";
import type { BoardConfig } from "@langfuse-board/shared";

const testConfig: BoardConfig = {
  name: "Test",
  dimensions: [
    { key: "userId", label: "User", source: "trace", show: ["feed", "breakdown"] },
    { key: "account_id", label: "Account", source: "metadata", show: ["feed", "breakdown"] },
    { key: "user_name", label: "Name", source: "metadata", show: ["feed"] },
  ],
};

function createFeedTestApp(config?: BoardConfig) {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    listTraces: async (limit: number) => ({
      data: [
        {
          id: "trace-1",
          timestamp: "2024-01-15T12:00:00Z",
          name: "chat-completion",
          userId: "alice@company.com",
          sessionId: null,
          latency: 1.2,
          totalCost: 0.05,
          metadata: { account_id: "acme", user_name: "Alice", plan: "pro" },
          observations: [{ model: "gpt-4o", level: "DEFAULT" }],
        },
        {
          id: "trace-2",
          timestamp: "2024-01-15T11:59:50Z",
          name: "summarize",
          userId: "bob@company.com",
          sessionId: null,
          latency: 2.5,
          totalCost: 0.12,
          metadata: { account_id: "beta" },
          observations: [{ model: "claude-sonnet-4-20250514", level: "ERROR" }],
        },
      ].slice(0, limit),
    }),
    getDailyMetrics: async () => ({ data: [] }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;

  const cache = new InMemoryCache();
  return { app: createApp({ langfuse, cache, boardConfig: config ?? testConfig }), cache };
}

describe("GET /api/feed", () => {
  it("returns feed items with dimensions from config", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed");
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.items).toHaveLength(2);

    const first = body.items[0];
    expect(first.id).toBe("trace-1");
    expect(first.name).toBe("chat-completion");
    expect(first.latencyMs).toBe(1200);
    expect(first.cost).toBe(0.05);
    expect(first.status).toBe("success");

    expect(first.dimensions.userId).toBe("alice@company.com");
    expect(first.dimensions.account_id).toBe("acme");
    expect(first.dimensions.user_name).toBe("Alice");
  });

  it("returns null for missing metadata dimensions", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed");
    const body = await res.json() as any;

    const second = body.items[1];
    expect(second.dimensions.account_id).toBe("beta");
    expect(second.dimensions.user_name).toBeNull();
  });

  it("detects error status from observations", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed");
    const body = await res.json() as any;

    expect(body.items[1].status).toBe("error");
  });

  it("respects limit parameter", async () => {
    const { app } = createFeedTestApp();

    const res = await app.request("/api/feed?limit=1");
    const body = await res.json() as any;

    expect(body.items).toHaveLength(1);
  });

  it("returns empty dimensions when no config dimensions", async () => {
    const emptyConfig: BoardConfig = { name: "Empty", dimensions: [] };
    const { app } = createFeedTestApp(emptyConfig);

    const res = await app.request("/api/feed");
    const body = await res.json() as any;

    expect(body.items[0].dimensions).toEqual({});
  });
});
