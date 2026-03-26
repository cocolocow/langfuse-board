import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { LangfuseClient } from "../../langfuse/client.js";

function createOverviewTestApp() {
  const langfuse = {
    queryMetrics: async () => ({
      data: [{ avg_latency: 1200 }],
    }),
    getDailyMetrics: async () => ({
      data: [
        { date: "2024-01-15", countTraces: 500, countObservations: 1000, totalCost: 42.5, usage: [] },
        { date: "2024-01-16", countTraces: 600, countObservations: 1200, totalCost: 55.0, usage: [] },
      ],
    }),
    listTraces: async () => ({ data: [] }),
    healthCheck: async () => true,
  } as LangfuseClient;

  const cache = new InMemoryCache();
  return createApp({ langfuse, cache, boardConfig: DEFAULT_CONFIG });
}

const q = "?from=2024-01-15T00:00:00Z&to=2024-01-16T23:59:59Z";

describe("GET /api/overview", () => {
  it("returns overview KPIs from daily API and trends", async () => {
    const app = createOverviewTestApp();
    const res = await app.request(`/api/overview${q}`);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.kpis.totalCost.value).toBe(97.5);
    expect(body.kpis.totalTraces.value).toBe(1100);
    expect(body.kpis.avgLatency.value).toBe(1200);
    expect(body.costTrend).toHaveLength(2);
    expect(body.tracesTrend).toHaveLength(2);
    expect(body.costTrend[0].timestamp).toBe("2024-01-15");
  });

  it("returns 400 for invalid query params", async () => {
    const app = createOverviewTestApp();
    const res = await app.request("/api/overview?from=bad");
    expect(res.status).toBe(400);
  });
});
