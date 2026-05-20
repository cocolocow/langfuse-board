import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { ILangfuseClient } from "../../langfuse/client.js";

function makeApp() {
  const now = Date.now();
  // 11 days of stable cost = 1, then 1 huge spike day
  const traces = [
    ...Array.from({ length: 11 }, (_, i) => ({
      id: `t${i}`,
      timestamp: new Date(now - (12 - i) * 24 * 60 * 60 * 1000).toISOString(),
      name: "chat",
      userId: "u1", sessionId: null, latency: 1, totalCost: 1.0,
      metadata: { purpose: "chat_pipeline" },
      observations: [],
    })),
    {
      id: "spike",
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      name: "chat",
      userId: "u1", sessionId: null, latency: 1, totalCost: 50.0,
      metadata: { purpose: "chat_pipeline" },
      observations: [],
    },
  ];

  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    getDailyMetrics: async () => ({ data: [] }),
    listTraces: async () => ({ data: traces }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/anomalies", () => {
  it("flags the spike day", async () => {
    const app = makeApp();
    const res = await app.request("/api/anomalies?lookbackDays=14&zThreshold=2&force=true");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.some((a: any) => a.value >= 50)).toBe(true);
  });
});
