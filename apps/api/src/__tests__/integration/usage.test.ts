import { describe, it, expect } from "vitest";
import { createTestApp, defaultQuery, queryKey } from "./helpers.js";
import type { LangfuseMetricsResponse } from "@langfuse-board/shared";

const mockData: Record<string, LangfuseMetricsResponse> = {
  "traces:none:sum_totalCost,count_count": {
    data: [{ sum_totalCost: 50, count: 300 }],
  },
  "traces:none:count_count_t:day": {
    data: [
      { time_dimension: "2024-01-01", count: 100 },
      { time_dimension: "2024-01-02", count: 200 },
    ],
  },
  "traces:none:sum_totalTokens_t:day": {
    data: [
      { time_dimension: "2024-01-01", sum_totalTokens: 50000 },
      { time_dimension: "2024-01-02", sum_totalTokens: 80000 },
    ],
  },
  "observations:providedModelName:sum_totalTokens,sum_totalCost,count_count": {
    data: [
      { providedModelName: "gpt-4", sum_totalTokens: 50000, sum_totalCost: 40, count: 100 },
      { providedModelName: "gpt-3.5", sum_totalTokens: 200000, sum_totalCost: 10, count: 200 },
    ],
  },
  "traces:userId:count_count,sum_totalCost": {
    data: [
      { userId: "user-1", count: 150, sum_totalCost: 30 },
      { userId: "user-2", count: 100, sum_totalCost: 15 },
    ],
  },
};

describe("GET /api/usage", () => {
  it("returns usage data with top users and models", async () => {
    const { app } = createTestApp((q) => mockData[queryKey(q)] ?? { data: [] });

    const res = await app.request(`/api/usage${defaultQuery}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalTraces.value).toBe(300);
    expect(body.activeUsers.value).toBe(2);
    expect(body.topUsers).toHaveLength(2);
    expect(body.topUsers[0].userId).toBe("user-1");
    expect(body.topModels).toHaveLength(2);
    expect(body.tracesTrend).toHaveLength(2);
    expect(body.tokensTrend).toHaveLength(2);
  });
});
