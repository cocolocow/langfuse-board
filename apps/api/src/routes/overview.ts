import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import { calculateDelta } from "@langfuse-board/shared";
import {
  costTotalQuery,
  costTrendQuery,
  tracesTrendQuery,
  latencyQuery,
} from "../langfuse/queries.js";
import type {
  OverviewResponse,
  LangfuseMetricsResponse,
  TimeseriesPoint,
} from "@langfuse-board/shared";

export function createOverviewRoutes(
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
    const cacheKey = `overview:${from}:${to}:${granularity}`;

    const cached = cache.get<OverviewResponse>(cacheKey);
    if (cached) return c.json(cached);

    const params = { from, to, granularity };

    const [costTotal, costTrend, tracesTrend, latency] = await Promise.all([
      langfuse.queryMetrics(costTotalQuery(params)),
      langfuse.queryMetrics(costTrendQuery(params)),
      langfuse.queryMetrics(tracesTrendQuery(params)),
      langfuse.queryMetrics(latencyQuery(params)),
    ]);

    const totalCostValue = sumMetric(costTotal, "sum_totalCost");
    const totalTracesValue = sumMetric(costTotal, "count");
    const avgLatencyValue = firstMetric(latency, "average_latency");
    const p95LatencyValue = firstMetric(latency, "p95_latency");

    const response: OverviewResponse = {
      kpis: {
        totalCost: {
          label: "Total Cost",
          value: totalCostValue,
          previousValue: null,
          unit: "currency",
          trend: null,
        },
        totalTraces: {
          label: "Total Traces",
          value: totalTracesValue,
          previousValue: null,
          unit: "number",
          trend: null,
        },
        avgLatency: {
          label: "Avg Latency",
          value: avgLatencyValue,
          previousValue: null,
          unit: "duration",
          trend: null,
        },
        errorRate: {
          label: "Error Rate",
          value: 0,
          previousValue: null,
          unit: "percent",
          trend: null,
        },
      },
      costTrend: toTimeseries(costTrend, "sum_totalCost"),
      tracesTrend: toTimeseries(tracesTrend, "count"),
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

function firstMetric(res: LangfuseMetricsResponse, field: string): number {
  return Number(res.data[0]?.[field]) || 0;
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
