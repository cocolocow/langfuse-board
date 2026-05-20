import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type { FeatureRow, FeaturesResponse } from "@langfuse-board/shared";

/**
 * Rolls all traces up by `metadata.purpose` (eg. carousel_signature, infographic_generation,
 * chat_pipeline, jordan_suggest_reply…) so the dashboard answers
 * "which feature costs me the most?". For each feature we also surface the top user
 * and top persona — the two next-most useful drill-down axes.
 */
export function createFeaturesRoutes(
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
    const cacheKey = `features:${from}:${to}`;
    const ttl = isHistorical(to) ? 86_400_000 : 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const traces = await langfuse.listTraces(100);
      const fromMs = Date.parse(from);
      const toMs = Date.parse(to);

      // Aggregate per purpose
      type FeatureAgg = {
        purpose: string;
        cost: number;
        count: number;
        userCosts: Map<string, number>;
        personaCosts: Map<string, number>;
        thisWeekCost: number;
        prevWeekCost: number;
      };
      const aggs = new Map<string, FeatureAgg>();
      const weekAgoMs = toMs - 7 * 24 * 60 * 60 * 1000;
      const twoWeeksAgoMs = toMs - 14 * 24 * 60 * 60 * 1000;

      for (const trace of traces.data) {
        const ts = Date.parse(trace.timestamp);
        if (ts < fromMs || ts > toMs) continue;
        const meta = (trace.metadata as Record<string, unknown> | null) ?? {};
        const purpose = String(meta.purpose ?? trace.name ?? "unknown");
        const cost = trace.totalCost ?? 0;
        const user = String(meta.user_name ?? "—") || "—";
        const persona = String(meta.persona_id ?? "—") || "—";

        let agg = aggs.get(purpose);
        if (!agg) {
          agg = {
            purpose,
            cost: 0,
            count: 0,
            userCosts: new Map(),
            personaCosts: new Map(),
            thisWeekCost: 0,
            prevWeekCost: 0,
          };
          aggs.set(purpose, agg);
        }
        agg.cost += cost;
        agg.count += 1;
        agg.userCosts.set(user, (agg.userCosts.get(user) ?? 0) + cost);
        agg.personaCosts.set(persona, (agg.personaCosts.get(persona) ?? 0) + cost);
        if (ts >= weekAgoMs) {
          agg.thisWeekCost += cost;
        } else if (ts >= twoWeeksAgoMs) {
          agg.prevWeekCost += cost;
        }
      }

      const totalCost = Array.from(aggs.values()).reduce((s, a) => s + a.cost, 0);

      const items: FeatureRow[] = Array.from(aggs.values())
        .map((a) => ({
          name: a.purpose,
          purpose: a.purpose,
          cost: a.cost,
          count: a.count,
          trendLastWeek:
            a.prevWeekCost === 0
              ? a.thisWeekCost > 0
                ? 100
                : null
              : ((a.thisWeekCost - a.prevWeekCost) / a.prevWeekCost) * 100,
          topUser: maxKey(a.userCosts),
          topPersona: maxKey(a.personaCosts),
        }))
        .sort((a, b) => b.cost - a.cost);

      const fresh: FeaturesResponse = { items, totalCost };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}

function maxKey(m: Map<string, number>): string | null {
  let best: string | null = null;
  let bestVal = -Infinity;
  for (const [k, v] of m) {
    if (v > bestVal) {
      best = k;
      bestVal = v;
    }
  }
  return best;
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
