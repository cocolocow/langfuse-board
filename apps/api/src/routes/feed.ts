import { Hono } from "hono";
import { z } from "zod";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import type { FeedItem, FeedResponse } from "@langfuse-board/shared";

const feedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(30),
});

export function createFeedRoutes(
  langfuse: LangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = feedQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { limit } = parsed.data;
    const cacheKey = `feed:${limit}`;

    const cached = cache.get<FeedResponse>(cacheKey);
    if (cached) return c.json(cached);

    const traces = await langfuse.listTraces(limit);

    const items: FeedItem[] = traces.data.map((trace) => {
      const firstObs = trace.observations?.[0];
      const hasError =
        trace.observations?.some((o) => o.level === "ERROR") ?? false;

      return {
        id: trace.id,
        timestamp: trace.timestamp,
        userId: trace.userId,
        name: trace.name ?? "unknown",
        model: firstObs?.model ?? null,
        latencyMs: (trace.latency ?? 0) * 1000,
        cost: trace.totalCost ?? 0,
        status: hasError ? "error" : "success",
      };
    });

    const response: FeedResponse = { items };
    cache.set(cacheKey, response, 10_000);

    return c.json(response);
  });

  return app;
}
