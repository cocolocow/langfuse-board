import { Hono } from "hono";
import { z } from "zod";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type { TimeseriesPoint, TimeseriesResponse } from "@langfuse-board/shared";

const querySchema = dateRangeSchema.extend({
  metric: z.enum(["cost", "tokens", "traces"]).default("cost"),
  groupBy: z.enum(["model", "user", "feature", "persona", "none"]).default("none"),
});

/**
 * Returns a daily timeseries optionally grouped by a dimension (model, user,
 * feature, persona). Powers the Trends page's multi-series charts and the
 * Overview's "vs last period" sparklines.
 */
export function createTimeseriesRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = querySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }
    const { from, to, metric, groupBy } = parsed.data;
    const cacheKey = `timeseries:${metric}:${groupBy}:${from}:${to}`;
    const ttl = isHistorical(to) ? 86_400_000 : 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const traces = await langfuse.listTraces(100);
      const fromMs = Date.parse(from);
      const toMs = Date.parse(to);

      // (groupKey, day) → metric value
      const cells = new Map<string, Map<string, number>>();

      for (const trace of traces.data) {
        const ts = Date.parse(trace.timestamp);
        if (ts < fromMs || ts > toMs) continue;
        const meta = (trace.metadata as Record<string, unknown> | null) ?? {};
        const day = trace.timestamp.slice(0, 10);
        const value = pickMetric(trace, meta, metric);
        const groupKey =
          groupBy === "none"
            ? "total"
            : groupBy === "model"
            ? String(meta.model ?? "unknown")
            : groupBy === "user"
            ? String(meta.user_name ?? meta.user_id ?? "anonymous")
            : groupBy === "feature"
            ? String(meta.purpose ?? trace.name ?? "unknown")
            : String(meta.persona_id ?? "—");

        let row = cells.get(groupKey);
        if (!row) {
          row = new Map();
          cells.set(groupKey, row);
        }
        row.set(day, (row.get(day) ?? 0) + value);
      }

      const series = Array.from(cells.entries())
        .map(([label, days]) => ({
          label,
          points: Array.from(days.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([timestamp, value]) => ({ timestamp, value } as TimeseriesPoint)),
        }))
        // Order series by total descending — best for legends
        .sort(
          (a, b) =>
            b.points.reduce((s, p) => s + p.value, 0) -
            a.points.reduce((s, p) => s + p.value, 0),
        )
        // Cap at 10 series so the chart stays readable
        .slice(0, 10);

      const fresh: TimeseriesResponse = { metric, groupBy, series };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}

function pickMetric(
  trace: { totalCost: number; observations: unknown[] },
  meta: Record<string, unknown>,
  metric: "cost" | "tokens" | "traces",
): number {
  if (metric === "cost") return trace.totalCost ?? 0;
  if (metric === "tokens") return Number(meta.total_tokens ?? 0);
  return 1; // each trace is one count
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
