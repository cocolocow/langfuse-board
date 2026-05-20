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
          metadata: { purpose: "chat_pipeline", user_name: "Coco", persona_id: "steve_jobs" },
          observations: [],
        },
        {
          id: "t2", timestamp: "2026-05-20T10:00:00Z", name: "chat",
          userId: "u2", sessionId: null, latency: 1, totalCost: 0.1,
          metadata: { purpose: "lead_analysis_jordan", user_name: "Alice", persona_id: "jordan_belfort" },
          observations: [],
        },
        {
          // No persona — should be skipped
          id: "t3", timestamp: "2026-05-20T11:00:00Z", name: "ingestion",
          userId: null, sessionId: null, latency: 1, totalCost: 0.01,
          metadata: { purpose: "ingestion_embedding" },
          observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/personas", () => {
  it("aggregates by persona_id and skips traces without one", async () => {
    const app = makeApp();
    const res = await app.request(`/api/personas${q}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.items).toHaveLength(2);
    const steve = body.items.find((p: any) => p.persona === "steve_jobs");
    expect(steve).toBeDefined();
    expect(steve.cost).toBeCloseTo(0.5, 5);
    expect(steve.count).toBe(1);
    expect(steve.topUsers[0].user).toBe("Coco");
  });
});
