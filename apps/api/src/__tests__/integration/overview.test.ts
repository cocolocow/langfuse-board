import { describe, it, expect } from "vitest";
import { createTestApp, defaultQuery, queryKey } from "./helpers.js";
import type { LangfuseMetricsResponse } from "@langfuse-board/shared";

const mockData: Record<string, LangfuseMetricsResponse> = {
  "traces:none:sum_totalCost,count_count": {
    data: [{ sum_totalCost: 42.5, count: 1200 }],
  },
  "traces:none:sum_totalCost_t:day": {
    data: [
      { time_dimension: "2024-01-01", sum_totalCost: 10 },
      { time_dimension: "2024-01-02", sum_totalCost: 15 },
    ],
  },
  "traces:none:count_count_t:day": {
    data: [
      { time_dimension: "2024-01-01", count: 50 },
      { time_dimension: "2024-01-02", count: 60 },
    ],
  },
  "traces:none:avg_latency,p95_latency": {
    data: [{ avg_latency: 1200, p95_latency: 3500 }],
  },
};

describe("GET /api/overview", () => {
  it("returns overview KPIs and trends", async () => {
    const { app } = createTestApp((q) => mockData[queryKey(q)] ?? { data: [] });

    const res = await app.request(`/api/overview${defaultQuery}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.kpis.totalCost.value).toBe(42.5);
    expect(body.kpis.totalCost.unit).toBe("currency");
    expect(body.kpis.totalTraces.value).toBe(1200);
    expect(body.kpis.avgLatency.value).toBe(1200);
    expect(body.costTrend).toHaveLength(2);
    expect(body.tracesTrend).toHaveLength(2);
  });

  it("returns 400 for invalid query params", async () => {
    const { app } = createTestApp(() => ({ data: [] }));
    const res = await app.request("/api/overview?from=bad");
    expect(res.status).toBe(400);
  });

  it("caches responses", async () => {
    let callCount = 0;
    const { app } = createTestApp((q) => {
      callCount++;
      return mockData[queryKey(q)] ?? { data: [] };
    });

    const res1 = await app.request(`/api/overview${defaultQuery}`);
    const firstCallCount = callCount;
    const res2 = await app.request(`/api/overview${defaultQuery}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(callCount).toBe(firstCallCount);
  });
});
