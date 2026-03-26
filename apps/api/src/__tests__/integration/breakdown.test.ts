import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import type { LangfuseClient } from "../../langfuse/client.js";
import type { BoardConfig } from "@langfuse-board/shared";

const testConfig: BoardConfig = {
  name: "Test",
  dimensions: [
    { key: "userId", label: "User", source: "trace", show: ["feed", "breakdown"] },
    { key: "account_id", label: "Account", source: "metadata", show: ["feed", "breakdown"] },
    { key: "user_name", label: "Name", source: "metadata", show: ["feed"] },
  ],
};

function createBreakdownTestApp() {
  const langfuse = {
    queryMetrics: async (query: { dimensions?: { field: string }[] }) => {
      if (query.dimensions?.[0]?.field === "userId") {
        return {
          data: [
            { userId: "alice", sum_totalCost: 50, count_count: 200 },
            { userId: "bob", sum_totalCost: 30, count_count: 150 },
            { userId: null, sum_totalCost: 5, count_count: 10 },
          ],
        };
      }
      return { data: [] };
    },
    listTraces: async () => ({
      data: [
        {
          id: "t-1", timestamp: "2024-01-15T12:00:00Z", name: "chat",
          userId: "alice", latency: 1, totalCost: 0.05,
          metadata: { account_id: "acme", user_name: "Alice" }, observations: [],
        },
        {
          id: "t-2", timestamp: "2024-01-15T11:00:00Z", name: "search",
          userId: "bob", latency: 0.5, totalCost: 0.03,
          metadata: { account_id: "acme", user_name: "Bob" }, observations: [],
        },
        {
          id: "t-3", timestamp: "2024-01-15T10:00:00Z", name: "chat",
          userId: "charlie", latency: 2, totalCost: 0.08,
          metadata: { account_id: "beta" }, observations: [],
        },
        {
          id: "t-4", timestamp: "2024-01-10T10:00:00Z", name: "chat",
          userId: "d", latency: 1, totalCost: 0.02,
          metadata: { account_id: "gamma" }, observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } as LangfuseClient;

  const cache = new InMemoryCache();
  return createApp({ langfuse, cache, boardConfig: testConfig });
}

const dateParams = "&from=2024-01-14T00:00:00Z&to=2024-01-16T00:00:00Z";

describe("GET /api/breakdown", () => {
  it("returns breakdown by trace field (userId)", async () => {
    const app = createBreakdownTestApp();
    const res = await app.request(`/api/breakdown?key=userId${dateParams}`);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dimension.key).toBe("userId");
    expect(body.dimension.label).toBe("User");
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].name).toBe("alice");
    expect(body.items[0].cost).toBe(50);
    expect(body.items[0].percentage).toBeGreaterThan(50);
  });

  it("returns breakdown by metadata field (account_id)", async () => {
    const app = createBreakdownTestApp();
    const res = await app.request(`/api/breakdown?key=account_id${dateParams}`);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.dimension.key).toBe("account_id");
    expect(body.dimension.label).toBe("Account");
    expect(body.items.length).toBeGreaterThanOrEqual(2);
    expect(body.items[0].name).toBe("acme");
  });

  it("returns 400 for unconfigured dimension", async () => {
    const app = createBreakdownTestApp();
    const res = await app.request(`/api/breakdown?key=unknown${dateParams}`);

    expect(res.status).toBe(400);
  });

  it("returns 400 for dimension not in breakdown show", async () => {
    const app = createBreakdownTestApp();
    const res = await app.request(`/api/breakdown?key=user_name${dateParams}`);

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing date params", async () => {
    const app = createBreakdownTestApp();
    const res = await app.request("/api/breakdown?key=userId");

    expect(res.status).toBe(400);
  });
});
