import { describe, it, expect } from "vitest";
import { createTestApp, defaultQuery, queryKey } from "./helpers.js";
import type { LangfuseMetricsResponse } from "@langfuse-board/shared";

const mockData: Record<string, LangfuseMetricsResponse> = {
  "traces:none:avg_latency,p95_latency": {
    data: [{ avg_latency: 1200, p95_latency: 3500 }],
  },
  "traces:none:avg_latency,p95_latency_t:day": {
    data: [
      { time_dimension: "2024-01-01", avg_latency: 1000, p95_latency: 3000 },
      { time_dimension: "2024-01-02", avg_latency: 1400, p95_latency: 4000 },
    ],
  },
  "scores-numeric:name:avg_value,count_count": {
    data: [
      { name: "helpfulness", avg_value: 0.85, count: 200 },
      { name: "accuracy", avg_value: 0.92, count: 180 },
    ],
  },
};

describe("GET /api/quality", () => {
  it("returns latency KPIs and scores", async () => {
    const { app } = createTestApp((q) => mockData[queryKey(q)] ?? { data: [] });

    const res = await app.request(`/api/quality${defaultQuery}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.avgLatency.value).toBe(1200);
    expect(body.avgLatency.unit).toBe("duration");
    expect(body.p95Latency.value).toBe(3500);
    expect(body.scores).toHaveLength(2);
    expect(body.scores[0].name).toBe("helpfulness");
    expect(body.scores[0].avg).toBe(0.85);
  });
});

describe("GET /api/health", () => {
  it("returns health status", async () => {
    const { app } = createTestApp(() => ({ data: [] }));

    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.langfuse).toBe(true);
    expect(typeof body.cacheSize).toBe("number");
  });
});
