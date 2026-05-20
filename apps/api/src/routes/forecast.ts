import { Hono } from "hono";
import { z } from "zod";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { projectFromTimeseries } from "@langfuse-board/shared";
import type { ForecastResponse, TimeseriesPoint } from "@langfuse-board/shared";

const querySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(30),
  /** How far back to look for the trend. Default 14 = stable signal + recent enough. */
  lookbackDays: z.coerce.number().min(7).max(60).default(14),
});

/**
 * Project cost + traces for the next N days based on the recent trend.
 * Uses Langfuse's daily metrics (no rate-limit cost). The transformer in
 * @langfuse-board/shared does the weighting; this route just gathers data.
 */
export function createForecastRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = querySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }
    const { days, lookbackDays } = parsed.data;
    const cacheKey = `forecast:${days}:${lookbackDays}`;
    const ttl = 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
      const from = fromDate.toISOString();
      const to = toDate.toISOString();

      const daily = await langfuse.getDailyMetrics({ from, to });
      const costPoints: TimeseriesPoint[] = daily.data.map((r) => ({
        timestamp: r.date,
        value: r.totalCost ?? 0,
      }));
      const tracePoints: TimeseriesPoint[] = daily.data.map((r) => ({
        timestamp: r.date,
        value: r.countTraces ?? 0,
      }));

      const projection = projectFromTimeseries(costPoints, tracePoints, days);

      const fresh: ForecastResponse = { ...projection, days };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}
