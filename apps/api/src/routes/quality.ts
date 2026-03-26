import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import {
  latencyQuery,
  latencyTrendQuery,
  scoresQuery,
} from "../langfuse/queries.js";
import type {
  QualityResponse,
  LangfuseMetricsResponse,
  TimeseriesPoint,
  ScoreSummary,
} from "@langfuse-board/shared";

export function createQualityRoutes(
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
    const cacheKey = `quality:${from}:${to}:${granularity}`;

    const cached = cache.get<QualityResponse>(cacheKey);
    if (cached) return c.json(cached);

    const params = { from, to, granularity };

    const [latency, latencyTrend, scores] = await Promise.all([
      langfuse.queryMetrics(latencyQuery(params)),
      langfuse.queryMetrics(latencyTrendQuery(params)),
      langfuse.queryMetrics(scoresQuery(params)),
    ]);

    const avgLatencyValue = firstMetric(latency, "avg_latency");
    const p95LatencyValue = firstMetric(latency, "p95_latency");

    const scoreSummaries: ScoreSummary[] = scores.data.map((row) => ({
      name: String(row["name"] ?? "unknown"),
      avg: Number(row["avg_value"]) || 0,
      count: Number(row["count"]) || 0,
    }));

    const response: QualityResponse = {
      avgLatency: {
        label: "Avg Response Time",
        value: avgLatencyValue,
        previousValue: null,
        unit: "duration",
        trend: null,
      },
      p95Latency: {
        label: "Slowest 5%",
        value: p95LatencyValue,
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
      latencyTrend: toTimeseries(latencyTrend, "avg_latency"),
      latencyByModel: {},
      scores: scoreSummaries,
    };

    const ttl = isHistorical(to) ? 3_600_000 : 300_000;
    cache.set(cacheKey, response, ttl);

    return c.json(response);
  });

  return app;
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
