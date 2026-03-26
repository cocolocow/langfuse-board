import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { ILangfuseClient } from "../../langfuse/client.js";

function createUsageTestApp() {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    getDailyMetrics: async () => ({
      data: [
        {
          date: "2024-01-15",
          countTraces: 500,
          countObservations: 1000,
          totalCost: 50,
          usage: [
            { model: "gpt-4", inputUsage: 100000, outputUsage: 30000, totalUsage: 130000, countTraces: 300, countObservations: 600, totalCost: 40 },
            { model: "gpt-3.5", inputUsage: 200000, outputUsage: 60000, totalUsage: 260000, countTraces: 200, countObservations: 400, totalCost: 10 },
          ],
        },
      ],
    }),
    listTraces: async () => ({
      data: [
        { id: "t-1", timestamp: "2024-01-15T12:00:00Z", name: "chat", userId: "alice", sessionId: null, latency: 1, totalCost: 0.05, metadata: null, observations: [] },
        { id: "t-2", timestamp: "2024-01-15T12:01:00Z", name: "chat", userId: "bob", sessionId: null, latency: 0.5, totalCost: 0.03, metadata: null, observations: [] },
        { id: "t-3", timestamp: "2024-01-15T12:02:00Z", name: "chat", userId: "alice", sessionId: null, latency: 2, totalCost: 0.08, metadata: null, observations: [] },
      ],
    }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;

  const cache = new InMemoryCache();
  return createApp({ langfuse, cache, boardConfig: DEFAULT_CONFIG });
}

const q = "?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z";

describe("GET /api/usage", () => {
  it("returns usage data from daily API with top users from traces", async () => {
    const app = createUsageTestApp();
    const res = await app.request(`/api/usage${q}`);

    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.totalTraces.value).toBe(500);
    expect(body.totalTokens.value).toBe(390000);
    expect(body.activeUsers.value).toBe(2);
    expect(body.topUsers).toHaveLength(2);
    expect(body.topUsers[0].userId).toBe("alice");
    expect(body.topUsers[0].traces).toBe(2);
    expect(body.topModels).toHaveLength(2);
    expect(body.tracesTrend).toHaveLength(1);
    expect(body.tokensTrend).toHaveLength(1);
  });
});
