import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { ILangfuseClient } from "../../langfuse/client.js";

function makeApp() {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    getDailyMetrics: async () => ({
      data: Array.from({ length: 7 }, (_, i) => ({
        date: `2026-05-${String(i + 14).padStart(2, "0")}`,
        countTraces: 100,
        countObservations: 200,
        totalCost: 5,
        usage: [],
      })),
    }),
    listTraces: async () => ({ data: [] }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/forecast", () => {
  it("projects cost and traces over the next 30 days", async () => {
    const app = makeApp();
    const res = await app.request("/api/forecast?days=30");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.days).toBe(30);
    expect(body.projected.cost).toBeCloseTo(5 * 30, 0); // ~$5/day × 30
    expect(body.projected.traces).toBeCloseTo(100 * 30, 0);
    expect(body.method).toBe("weighted_average");
    expect(body.confidence).toBeGreaterThan(0);
  });
});
