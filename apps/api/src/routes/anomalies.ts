import { Hono } from "hono";
import { z } from "zod";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { detectAnomalies } from "@langfuse-board/shared";
import type { AnomaliesResponse, TimeseriesPoint } from "@langfuse-board/shared";

const querySchema = z.object({
  lookbackDays: z.coerce.number().min(7).max(60).default(14),
  zThreshold: z.coerce.number().min(0.5).max(10).default(2.0),
});

/**
 * Surfaces unusual data points in the recent history:
 *  - daily total cost spike
 *  - per-feature cost spike (top 5 features)
 *
 * Uses a z-score over a leave-one-out window so a single spike doesn't poison
 * its own baseline. Returns the union of anomalies found in each series so the
 * Overview can show "watch out — carousel_signature blew up on the 18th".
 */
export function createAnomaliesRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = querySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }
    const { lookbackDays, zThreshold } = parsed.data;
    const cacheKey = `anomalies:${lookbackDays}:${zThreshold}`;
    const ttl = 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const traces = await langfuse.listTraces(100);
      const toMs = Date.now();
      const fromMs = toMs - lookbackDays * 24 * 60 * 60 * 1000;

      // Build daily totals: overall + per-feature
      const dailyTotal = new Map<string, number>();
      const dailyByFeature = new Map<string, Map<string, number>>();
      for (const trace of traces.data) {
        const ts = Date.parse(trace.timestamp);
        if (ts < fromMs || ts > toMs) continue;
        const day = trace.timestamp.slice(0, 10);
        const meta = (trace.metadata as Record<string, unknown> | null) ?? {};
        const purpose = String(meta.purpose ?? trace.name ?? "unknown");
        const cost = trace.totalCost ?? 0;

        dailyTotal.set(day, (dailyTotal.get(day) ?? 0) + cost);
        let f = dailyByFeature.get(purpose);
        if (!f) {
          f = new Map();
          dailyByFeature.set(purpose, f);
        }
        f.set(day, (f.get(day) ?? 0) + cost);
      }

      const allAnomalies = [
        ...detectAnomalies(toPoints(dailyTotal), "total:cost", zThreshold),
      ];

      // Only top 5 features to avoid noisy signals
      const topFeatures = Array.from(dailyByFeature.entries())
        .map(([feat, days]) => [feat, sumValues(days)] as const)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feat]) => feat);

      for (const feat of topFeatures) {
        const days = dailyByFeature.get(feat)!;
        allAnomalies.push(
          ...detectAnomalies(toPoints(days), `feature:${feat}`, zThreshold),
        );
      }

      const fresh: AnomaliesResponse = {
        items: allAnomalies.sort((a, b) => b.date.localeCompare(a.date)),
      };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}

function toPoints(m: Map<string, number>): TimeseriesPoint[] {
  return Array.from(m.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([timestamp, value]) => ({ timestamp, value }));
}

function sumValues(m: Map<string, number>): number {
  let s = 0;
  for (const v of m.values()) s += v;
  return s;
}
