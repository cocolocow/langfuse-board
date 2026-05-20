import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { ILangfuseClient } from "../../langfuse/client.js";

const q = "?from=2026-05-01T00:00:00Z&to=2026-05-31T23:59:59Z&force=true";

function makeApp() {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    getDailyMetrics: async () => ({ data: [] }),
    listTraces: async () => ({
      data: [
        {
          id: "t1", timestamp: "2026-05-19T10:00:00Z", name: "chat",
          userId: "u1", sessionId: null, latency: 1, totalCost: 0.5,
          metadata: { purpose: "carousel", model: "claude-sonnet-4-6", user_name: "Coco" },
          observations: [],
        },
        {
          id: "t2", timestamp: "2026-05-19T11:00:00Z", name: "chat",
          userId: "u2", sessionId: null, latency: 1, totalCost: 0.3,
          metadata: { purpose: "chat", model: "gpt-4o", user_name: "Alice" },
          observations: [],
        },
        {
          id: "t3", timestamp: "2026-05-20T10:00:00Z", name: "chat",
          userId: "u1", sessionId: null, latency: 1, totalCost: 0.1,
          metadata: { purpose: "carousel", model: "claude-sonnet-4-6", user_name: "Coco" },
          observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/timeseries", () => {
  it("groups by feature when requested", async () => {
    const app = makeApp();
    const res = await app.request(`/api/timeseries${q}&metric=cost&groupBy=feature`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.groupBy).toBe("feature");
    expect(body.series.length).toBe(2);
    const carousel = body.series.find((s: any) => s.label === "carousel");
    expect(carousel.points).toHaveLength(2);
  });

  it("returns a single 'total' series when groupBy=none", async () => {
    const app = makeApp();
    const res = await app.request(`/api/timeseries${q}&metric=cost&groupBy=none`);
    const body = (await res.json()) as any;
    expect(body.series.length).toBe(1);
    expect(body.series[0].label).toBe("total");
  });
});
