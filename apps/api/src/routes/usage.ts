import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import {
  dateRangeSchema,
  aggregateUsageByModel,
} from "@langfuse-board/shared";
import {
  costTotalQuery,
  tracesTrendQuery,
  tokensTrendQuery,
  usageByModelQuery,
  usageByUserQuery,
} from "../langfuse/queries.js";
import type {
  UsageResponse,
  LangfuseMetricsResponse,
  TimeseriesPoint,
  TopUser,
} from "@langfuse-board/shared";

export function createUsageRoutes(
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
    const cacheKey = `usage:${from}:${to}:${granularity}`;

    const cached = cache.get<UsageResponse>(cacheKey);
    if (cached) return c.json(cached);

    const params = { from, to, granularity };

    const [totals, tracesTrend, tokensTrend, byModel, byUser] =
      await Promise.all([
        langfuse.queryMetrics(costTotalQuery(params)),
        langfuse.queryMetrics(tracesTrendQuery(params)),
        langfuse.queryMetrics(tokensTrendQuery(params)),
        langfuse.queryMetrics(usageByModelQuery(params)),
        langfuse.queryMetrics(usageByUserQuery(params)),
      ]);

    const totalTracesValue = sumMetric(totals, "count");
    const totalTokensValue = sumMetric(totals, "sum_totalTokens") ||
      byModel.data.reduce((s, r) => s + (Number(r["sum_totalTokens"]) || 0), 0);

    const uniqueUsers = new Set(
      byUser.data.map((r) => String(r["userId"])).filter((u) => u && u !== "null"),
    );

    const topUsers: TopUser[] = byUser.data
      .filter((r) => r["userId"] && String(r["userId"]) !== "null")
      .slice(0, 10)
      .map((r) => ({
        userId: String(r["userId"]),
        traces: Number(r["count"]) || 0,
        cost: Number(r["sum_totalCost"]) || 0,
      }));

    const response: UsageResponse = {
      totalTraces: {
        label: "Total Traces",
        value: totalTracesValue,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      totalTokens: {
        label: "Total Tokens",
        value: totalTokensValue,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      activeUsers: {
        label: "Active Users",
        value: uniqueUsers.size,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      tracesTrend: toTimeseries(tracesTrend, "count"),
      tokensTrend: toTimeseries(tokensTrend, "sum_totalTokens"),
      topUsers,
      topModels: aggregateUsageByModel(byModel.data),
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

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
