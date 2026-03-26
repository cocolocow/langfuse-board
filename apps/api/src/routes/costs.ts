import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import {
  dateRangeSchema,
  aggregateCostByModel,
  projectMonthlyCost,
} from "@langfuse-board/shared";
import {
  costTotalQuery,
  costTrendQuery,
  costByModelQuery,
  costByTraceNameQuery,
} from "../langfuse/queries.js";
import type {
  CostsResponse,
  LangfuseMetricsResponse,
  TimeseriesPoint,
  CostBreakdown,
} from "@langfuse-board/shared";

export function createCostsRoutes(
  langfuse: LangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = dateRangeSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { from, to, granularity } = parsed.data;
    const cacheKey = `costs:${from}:${to}:${granularity}`;

    const cached = cache.get<CostsResponse>(cacheKey);
    if (cached) return c.json(cached);

    const params = { from, to, granularity };

    const [costTotal, costTrend, byModel, byTraceName] = await Promise.all([
      langfuse.queryMetrics(costTotalQuery(params)),
      langfuse.queryMetrics(costTrendQuery(params)),
      langfuse.queryMetrics(costByModelQuery(params)),
      langfuse.queryMetrics(costByTraceNameQuery(params)),
    ]);

    const totalValue = sumMetric(costTotal, "sum_totalCost");
    const trendData = toTimeseries(costTrend, "sum_totalCost");
    const projected = projectMonthlyCost(trendData);

    const response: CostsResponse = {
      total: {
        label: "Total Cost",
        value: totalValue,
        previousValue: null,
        unit: "currency",
        trend: null,
      },
      projected: {
        label: "Projected Monthly",
        value: projected,
        previousValue: null,
        unit: "currency",
        trend: null,
      },
      byModel: aggregateCostByModel(byModel.data),
      byTraceName: aggregateByName(byTraceName),
      trend: trendData,
      trendByModel: {},
    };

    const ttl = isHistorical(to) ? 3_600_000 : 300_000;
    cache.set(cacheKey, response, ttl);

    return c.json(response);
  });

  return app;
}

function sumMetric(res: LangfuseMetricsResponse, field: string): number {
  return res.data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

function toTimeseries(
  res: LangfuseMetricsResponse,
  field: string,
): TimeseriesPoint[] {
  return res.data.map((row) => ({
    timestamp: String(row["time"] ?? row["date"] ?? ""),
    value: Number(row[field]) || 0,
  }));
}

function aggregateByName(res: LangfuseMetricsResponse): CostBreakdown[] {
  const total = res.data.reduce(
    (sum, row) => sum + (Number(row["sum_totalCost"]) || 0),
    0,
  );

  return res.data
    .map((row) => {
      const cost = Number(row["sum_totalCost"]) || 0;
      return {
        name: String(row["name"] ?? "unknown"),
        cost,
        percentage: total > 0 ? (cost / total) * 100 : 0,
        tokens: Number(row["sum_totalTokens"]) || 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
