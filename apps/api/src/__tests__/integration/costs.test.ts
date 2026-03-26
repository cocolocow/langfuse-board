import { describe, it, expect } from "vitest";
import { createTestApp, defaultQuery, queryKey } from "./helpers.js";
import type { LangfuseMetricsResponse } from "@langfuse-board/shared";

const mockData: Record<string, LangfuseMetricsResponse> = {
  "traces:none:sum_totalCost,count_count": {
    data: [{ sum_totalCost: 100, count: 500 }],
  },
  "traces:none:sum_totalCost_t:day": {
    data: [
      { time_dimension: "2024-01-01", sum_totalCost: 20 },
      { time_dimension: "2024-01-02", sum_totalCost: 30 },
    ],
  },
  "observations:providedModelName:sum_totalCost,sum_totalTokens": {
    data: [
      { providedModelName: "gpt-4", sum_totalCost: 80, sum_totalTokens: 50000 },
      { providedModelName: "gpt-3.5", sum_totalCost: 20, sum_totalTokens: 200000 },
    ],
  },
  "traces:name:sum_totalCost,sum_totalTokens": {
    data: [
      { name: "chat", sum_totalCost: 60, sum_totalTokens: 100000 },
      { name: "search", sum_totalCost: 40, sum_totalTokens: 150000 },
    ],
  },
};

describe("GET /api/costs", () => {
  it("returns cost breakdown and trends", async () => {
    const { app } = createTestApp((q) => mockData[queryKey(q)] ?? { data: [] });

    const res = await app.request(`/api/costs${defaultQuery}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.total.value).toBe(100);
    expect(body.total.unit).toBe("currency");
    expect(body.byModel).toHaveLength(2);
    expect(body.byModel[0].name).toBe("gpt-4");
    expect(body.byTraceName).toHaveLength(2);
    expect(body.trend).toHaveLength(2);
    expect(body.projected.value).toBeGreaterThan(0);
  });

  it("returns 400 for missing params", async () => {
    const { app } = createTestApp(() => ({ data: [] }));
    const res = await app.request("/api/costs");
    expect(res.status).toBe(400);
  });
});
