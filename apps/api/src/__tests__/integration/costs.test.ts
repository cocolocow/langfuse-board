import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { ILangfuseClient } from "../../langfuse/client.js";

function createCostsTestApp() {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    getDailyMetrics: async () => ({
      data: [
        {
          date: "2024-01-15",
          countTraces: 500,
          countObservations: 1000,
          totalCost: 100,
          usage: [
            { model: "gpt-4", inputUsage: 100000, outputUsage: 30000, totalUsage: 130000, countTraces: 300, countObservations: 600, totalCost: 80 },
            { model: "gpt-3.5", inputUsage: 200000, outputUsage: 60000, totalUsage: 260000, countTraces: 200, countObservations: 400, totalCost: 20 },
          ],
        },
      ],
    }),
    listTraces: async () => ({ data: [] }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;

  const cache = new InMemoryCache();
  return createApp({ langfuse, cache, boardConfig: DEFAULT_CONFIG });
}

const q = "?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z";

describe("GET /api/costs", () => {
  it("returns cost breakdown from daily API", async () => {
    const app = createCostsTestApp();
    const res = await app.request(`/api/costs${q}`);

    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.total.value).toBe(100);
    expect(body.total.unit).toBe("currency");
    expect(body.byModel).toHaveLength(2);
    expect(body.byModel[0].name).toBe("gpt-4");
    expect(body.byModel[0].cost).toBe(80);
    expect(body.trend).toHaveLength(1);
    expect(body.projected.value).toBeGreaterThan(0);
  });

  it("returns 400 for missing params", async () => {
    const app = createCostsTestApp();
    const res = await app.request("/api/costs");
    expect(res.status).toBe(400);
  });
});
