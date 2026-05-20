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
          metadata: { purpose: "carousel_signature", user_name: "Coco", account_name: "Maniak", persona_id: "steve_jobs" },
          observations: [],
        },
        {
          id: "t2", timestamp: "2026-05-20T10:00:00Z", name: "chat",
          userId: "u1", sessionId: null, latency: 1, totalCost: 0.3,
          metadata: { purpose: "chat_pipeline", user_name: "Coco", account_name: "Maniak", persona_id: "steve_jobs" },
          observations: [],
        },
        {
          id: "t3", timestamp: "2026-05-20T11:00:00Z", name: "chat",
          userId: "u2", sessionId: null, latency: 1, totalCost: 0.1,
          metadata: { purpose: "chat_pipeline", user_name: "Alice", account_name: "OtherCorp" },
          observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
  return createApp({ langfuse, cache: new InMemoryCache(), boardConfig: DEFAULT_CONFIG });
}

describe("GET /api/users-detail", () => {
  it("returns per-user breakdown with top features", async () => {
    const app = makeApp();
    const res = await app.request(`/api/users-detail${q}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.items).toHaveLength(2);
    const coco = body.items.find((u: any) => u.userName === "Coco");
    expect(coco).toBeDefined();
    expect(coco.totalCost).toBeCloseTo(0.8, 5);
    expect(coco.accountName).toBe("Maniak");
    expect(coco.topFeatures.length).toBeGreaterThan(0);
    expect(coco.topPersonas[0].persona).toBe("steve_jobs");
  });
});
