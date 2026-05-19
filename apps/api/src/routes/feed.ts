import { Hono } from "hono";
import { z } from "zod";
import type { ILangfuseClient, LangfuseTrace } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import type { FeedItem, FeedResponse, BoardConfig, Dimension } from "@langfuse-board/shared";

const feedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(30),
});

const TRACE_FIELD_MAP: Record<string, (trace: LangfuseTrace) => string | null> = {
  userId: (t) => t.userId,
  name: (t) => t.name,
  providedModelName: (t) => {
    const obs = t.observations?.find(
      (o): o is { model: string | null; level: string } => typeof o === "object" && o !== null,
    );
    return obs?.model ?? (t.metadata as Record<string, unknown> | null)?.["model"] as string | undefined ?? null;
  },
};

function extractDimension(trace: LangfuseTrace, dim: Dimension): string | null {
  if (dim.source === "trace") {
    const extractor = TRACE_FIELD_MAP[dim.key];
    return extractor ? extractor(trace) : null;
  }

  if (dim.source === "metadata" && trace.metadata && typeof trace.metadata === "object") {
    const value = trace.metadata[dim.key];
    return value != null ? String(value) : null;
  }

  return null;
}

export function createFeedRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
  boardConfig?: BoardConfig,
) {
  const app = new Hono();
  const feedDimensions = boardConfig?.dimensions.filter((d) => d.show.includes("feed")) ?? [];

  app.get("/", async (c) => {
    const parsed = feedQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { limit } = parsed.data;
    const cacheKey = `feed:${limit}`;

    const response = await serveOrStale(c, cache, cacheKey, 1_800_000, async () => {
    const traces = await langfuse.listTraces(limit);

    const items: FeedItem[] = traces.data.map((trace) => {
      const obsObjects = trace.observations?.filter(
        (o): o is { model: string | null; level: string } => typeof o === "object" && o !== null,
      ) ?? [];
      const hasError = obsObjects.some((o) => o.level === "ERROR");

      const dimensions: Record<string, string | null> = {};
      for (const dim of feedDimensions) {
        dimensions[dim.key] = extractDimension(trace, dim);
      }

      // Langfuse computes latency from observation start/end timestamps. When
      // our trace_generation creates and ends an observation immediately, the
      // SDK reports latency ≈ 0. Fall back to the duration_s we already put
      // in metadata so the feed shows real timings.
      const metaDuration = Number(trace.metadata?.duration_s ?? 0);
      const latencyMs =
        (trace.latency ?? 0) * 1000 || (Number.isFinite(metaDuration) ? metaDuration * 1000 : 0);

      return {
        id: trace.id,
        timestamp: trace.timestamp,
        name: trace.name ?? "unknown",
        latencyMs,
        cost: trace.totalCost ?? 0,
        status: hasError ? "error" : "success",
        dimensions,
      };
    });

    const fresh: FeedResponse = { items };
    // Cache 30min: feed is "live" but we trade freshness for fewer Langfuse calls (free-tier 100/day cap)
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}
