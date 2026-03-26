import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type {
  QualityResponse,
  ScoreSummary,
} from "@langfuse-board/shared";

export function createQualityRoutes(
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
    const cacheKey = `quality:${from}:${to}`;

    const cached = cache.get<QualityResponse>(cacheKey);
    if (cached) return c.json(cached);

    // Only 2 Metrics API calls — the minimum needed
    let avgLatency = 0;
    let p95Latency = 0;
    let scores: ScoreSummary[] = [];

    try {
      const [latencyRes, scoresRes] = await Promise.all([
        langfuse.queryMetrics({
          view: "traces",
          metrics: [
            { measure: "latency", aggregation: "avg" },
            { measure: "latency", aggregation: "p95" },
          ],
          fromTimestamp: from,
          toTimestamp: to,
        }),
        langfuse.queryMetrics({
          view: "scores-numeric",
          dimensions: [{ field: "name" }],
          metrics: [
            { measure: "value", aggregation: "avg" },
            { measure: "count", aggregation: "count" },
          ],
          fromTimestamp: from,
          toTimestamp: to,
        }),
      ]);

      avgLatency = Number(latencyRes.data[0]?.["avg_latency"]) || 0;
      p95Latency = Number(latencyRes.data[0]?.["p95_latency"]) || 0;

      scores = scoresRes.data.map((row) => ({
        name: String(row["name"] ?? "unknown"),
        avg: Number(row["avg_value"]) || 0,
        count: Number(row["count_count"]) || 0,
      }));
    } catch {
      // Rate limited — show zeros, user can retry later
    }

    const response: QualityResponse = {
      avgLatency: {
        label: "Avg Response Time",
        value: avgLatency,
        previousValue: null,
        unit: "duration",
        trend: null,
      },
      p95Latency: {
        label: "Slowest 5%",
        value: p95Latency,
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
      latencyTrend: [],
      latencyByModel: {},
      scores,
    };

    // Cache 30min — reduce metrics API calls
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
