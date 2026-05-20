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
          metadata: { purpose: "carousel_signature", user_name: "Coco", persona_id: "steve_jobs" },
          observations: [],
        },
        {
          id: "t2", timestamp: "2026-05-20T10:00:00Z", name: "chat",
          userId: "u1", sessionId: null, latency: 1, totalCost: 0.3,
          metadata: { purpose: "carousel_signature", user_name: "Coco", persona_id: "steve_jobs" },
          observations: [],
        },
        {
          id: "t3", timestamp: "2026-05-20T11:00:00Z", name: "chat",
          userId: "u2", sessionId: null, latency: 1, totalCost: 0.1,
          metadata: { purpose: "chat_pipeline", user_name: "Alice", persona_id: "jordan_belfort" },
          observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/features", () => {
  it("aggregates by purpose with top user + top persona", async () => {
    const app = makeApp();
    const res = await app.request(`/api/features${q}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.items).toHaveLength(2);
    expect(body.items[0].name).toBe("carousel_signature");
    expect(body.items[0].cost).toBeCloseTo(0.8, 5);
    expect(body.items[0].count).toBe(2);
    expect(body.items[0].topUser).toBe("Coco");
    expect(body.items[0].topPersona).toBe("steve_jobs");
    expect(body.totalCost).toBeCloseTo(0.9, 5);
  });

  it("returns 400 on missing date range", async () => {
    const app = makeApp();
    const res = await app.request("/api/features");
    expect(res.status).toBe(400);
  });
});
