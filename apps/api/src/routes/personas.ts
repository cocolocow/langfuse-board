import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type { PersonaRow, PersonasResponse, TimeseriesPoint } from "@langfuse-board/shared";

/**
 * Roll traces up by `metadata.persona_id` so we can answer "which AI persona is
 * being used the most, on what features, by whom?". The product ships ~11
 * personas (Steve, Jordan, MrBeast, …) — this view lets Coco see which ones
 * are pulling their weight.
 */
export function createPersonasRoutes(
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
    const cacheKey = `personas:${from}:${to}`;
    const ttl = isHistorical(to) ? 86_400_000 : 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const traces = await langfuse.listTraces(100);
      const fromMs = Date.parse(from);
      const toMs = Date.parse(to);

      type PersonaAgg = {
        persona: string;
        cost: number;
        count: number;
        featureCosts: Map<string, number>;
        userCosts: Map<string, number>;
        dailyCost: Map<string, number>;
      };
      const byPersona = new Map<string, PersonaAgg>();

      for (const trace of traces.data) {
        const ts = Date.parse(trace.timestamp);
        if (ts < fromMs || ts > toMs) continue;
        const meta = (trace.metadata as Record<string, unknown> | null) ?? {};
        const persona = String(meta.persona_id ?? "");
        if (!persona) continue; // skip traces with no persona context
        const purpose = String(meta.purpose ?? trace.name ?? "unknown");
        const userName = String(meta.user_name ?? "—") || "—";
        const cost = trace.totalCost ?? 0;
        const day = trace.timestamp.slice(0, 10);

        let agg = byPersona.get(persona);
        if (!agg) {
          agg = {
            persona,
            cost: 0,
            count: 0,
            featureCosts: new Map(),
            userCosts: new Map(),
            dailyCost: new Map(),
          };
          byPersona.set(persona, agg);
        }
        agg.cost += cost;
        agg.count += 1;
        agg.featureCosts.set(purpose, (agg.featureCosts.get(purpose) ?? 0) + cost);
        agg.userCosts.set(userName, (agg.userCosts.get(userName) ?? 0) + cost);
        agg.dailyCost.set(day, (agg.dailyCost.get(day) ?? 0) + cost);
      }

      const items: PersonaRow[] = Array.from(byPersona.values())
        .sort((a, b) => b.cost - a.cost)
        .map((p) => ({
          persona: p.persona,
          cost: p.cost,
          count: p.count,
          topFeatures: topN(p.featureCosts, 5).map(([name, cost]) => ({ name, cost })),
          topUsers: topN(p.userCosts, 5).map(([user, cost]) => ({ user, cost })),
          costTrend7d: trendFromMap(p.dailyCost),
        }));

      const fresh: PersonasResponse = { items };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}

function topN(m: Map<string, number>, n: number): [string, number][] {
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function trendFromMap(m: Map<string, number>): TimeseriesPoint[] {
  return Array.from(m.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([timestamp, value]) => ({ timestamp, value }));
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
