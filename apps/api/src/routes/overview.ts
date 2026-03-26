import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type {
  OverviewResponse,
  TimeseriesPoint,
} from "@langfuse-board/shared";

export function createOverviewRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = dateRangeSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { from, to } = parsed.data;
    const cacheKey = `overview:${from}:${to}`;

    const cached = cache.get<OverviewResponse>(cacheKey);
    if (cached) return c.json(cached);

    // Daily Metrics API — zero metrics quota cost
    const daily = await langfuse.getDailyMetrics({ from, to });

    let totalCost = 0;
    let totalTraces = 0;
    const costTrend: TimeseriesPoint[] = [];
    const tracesTrend: TimeseriesPoint[] = [];

    for (const row of daily.data) {
      totalCost += row.totalCost ?? 0;
      totalTraces += row.countTraces ?? 0;
      costTrend.push({ timestamp: row.date, value: row.totalCost ?? 0 });
      tracesTrend.push({ timestamp: row.date, value: row.countTraces ?? 0 });
    }

    // Latency still needs Metrics API (1 call)
    let avgLatency = 0;
    try {
      const latency = await langfuse.queryMetrics({
        view: "traces",
        metrics: [{ measure: "latency", aggregation: "avg" }],
        fromTimestamp: from,
        toTimestamp: to,
      });
      avgLatency = Number(latency.data[0]?.["avg_latency"]) || 0;
    } catch {
      // Rate limited — graceful degradation
    }

    const response: OverviewResponse = {
      kpis: {
        totalCost: {
          label: "Total Cost",
          value: totalCost,
          previousValue: null,
          unit: "currency",
          trend: null,
        },
        totalTraces: {
          label: "Total Requests",
          value: totalTraces,
          previousValue: null,
          unit: "number",
          trend: null,
        },
        avgLatency: {
          label: "Avg Response Time",
          value: avgLatency,
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
      costTrend,
      tracesTrend,
    };

    const ttl = isHistorical(to) ? 3_600_000 : 1_800_000;
    cache.set(cacheKey, response, ttl);

    return c.json(response);
  });

  return app;
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
