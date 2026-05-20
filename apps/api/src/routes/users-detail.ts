import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale, isForceRefresh } from "../cache/with-stale-fallback.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type { UserDetail, UsersDetailResponse, TimeseriesPoint } from "@langfuse-board/shared";

/**
 * Deep profile per user. For each user (top 50 by total cost) we expose the
 * features they used, the personas they triggered, and a daily cost trend.
 * Powers the Users page drill-down.
 */
export function createUsersDetailRoutes(
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
    const cacheKey = `users-detail:${from}:${to}`;
    const ttl = isHistorical(to) ? 86_400_000 : 7_200_000;

    const response = await serveOrStale(c, cache, cacheKey, ttl, async () => {
      const traces = await langfuse.listTraces(100);
      const fromMs = Date.parse(from);
      const toMs = Date.parse(to);

      type UserAgg = {
        userId: string;
        userName: string;
        accountName: string;
        totalCost: number;
        totalTraces: number;
        lastSeen: string;
        featureCosts: Map<string, { cost: number; count: number }>;
        personaCosts: Map<string, number>;
        dailyCost: Map<string, number>;
      };
      const byUser = new Map<string, UserAgg>();

      for (const trace of traces.data) {
        const ts = Date.parse(trace.timestamp);
        if (ts < fromMs || ts > toMs) continue;
        const meta = (trace.metadata as Record<string, unknown> | null) ?? {};
        const userName = String(meta.user_name ?? "");
        const userId = String(meta.user_id ?? trace.userId ?? "");
        // Group identifier: prefer userName for human readability, fallback to userId
        const key = userName || userId || "anonymous";
        const accountName = String(meta.account_name ?? "");
        const purpose = String(meta.purpose ?? trace.name ?? "unknown");
        const persona = String(meta.persona_id ?? "—") || "—";
        const cost = trace.totalCost ?? 0;
        const day = trace.timestamp.slice(0, 10);

        let agg = byUser.get(key);
        if (!agg) {
          agg = {
            userId,
            userName: userName || key,
            accountName,
            totalCost: 0,
            totalTraces: 0,
            lastSeen: trace.timestamp,
            featureCosts: new Map(),
            personaCosts: new Map(),
            dailyCost: new Map(),
          };
          byUser.set(key, agg);
        }
        agg.totalCost += cost;
        agg.totalTraces += 1;
        if (trace.timestamp > agg.lastSeen) agg.lastSeen = trace.timestamp;
        const feat = agg.featureCosts.get(purpose) ?? { cost: 0, count: 0 };
        feat.cost += cost;
        feat.count += 1;
        agg.featureCosts.set(purpose, feat);
        agg.personaCosts.set(persona, (agg.personaCosts.get(persona) ?? 0) + cost);
        agg.dailyCost.set(day, (agg.dailyCost.get(day) ?? 0) + cost);
      }

      const items: UserDetail[] = Array.from(byUser.values())
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 50)
        .map((u) => ({
          userName: u.userName,
          userId: u.userId,
          accountName: u.accountName,
          totalCost: u.totalCost,
          totalTraces: u.totalTraces,
          lastSeen: u.lastSeen,
          topFeatures: topN(u.featureCosts, 5).map(([name, v]) => ({
            name, cost: v.cost, count: v.count,
          })),
          topPersonas: topN(u.personaCosts, 3).map(([persona, cost]) => ({ persona, cost })),
          costTrend7d: trendFromMap(u.dailyCost),
        }));

      const fresh: UsersDetailResponse = { items };
      return fresh;
    }, { force: isForceRefresh(c) });

    return c.json(response);
  });

  return app;
}

function topN<V>(m: Map<string, V>, n: number): [string, V][] {
  // We need to know how to compare — assume V is a number or { cost: number }
  return Array.from(m.entries())
    .sort((a, b) => {
      const va = typeof a[1] === "number" ? a[1] : ((a[1] as unknown) as { cost: number }).cost;
      const vb = typeof b[1] === "number" ? b[1] : ((b[1] as unknown) as { cost: number }).cost;
      return vb - va;
    })
    .slice(0, n);
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
