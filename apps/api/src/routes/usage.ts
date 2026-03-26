import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { dateRangeSchema } from "@langfuse-board/shared";
import type {
  UsageResponse,
  TimeseriesPoint,
  TopUser,
} from "@langfuse-board/shared";
import type { ModelUsage } from "@langfuse-board/shared";

export function createUsageRoutes(
  langfuse: LangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = dateRangeSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { from, to } = parsed.data;
    const cacheKey = `usage:${from}:${to}`;

    const cached = cache.get<UsageResponse>(cacheKey);
    if (cached) return c.json(cached);

    // Daily Metrics API — zero metrics quota
    const daily = await langfuse.getDailyMetrics({ from, to });

    let totalTraces = 0;
    let totalTokens = 0;
    const tracesTrend: TimeseriesPoint[] = [];
    const tokensTrend: TimeseriesPoint[] = [];
    const modelMap = new Map<string, { tokens: number; traces: number; cost: number }>();

    for (const row of daily.data) {
      totalTraces += row.countTraces ?? 0;
      tracesTrend.push({ timestamp: row.date, value: row.countTraces ?? 0 });

      let dayTokens = 0;
      for (const usage of row.usage ?? []) {
        dayTokens += usage.totalUsage ?? 0;
        const entry = modelMap.get(usage.model) ?? { tokens: 0, traces: 0, cost: 0 };
        entry.tokens += usage.totalUsage ?? 0;
        entry.traces += usage.countTraces ?? 0;
        entry.cost += usage.totalCost ?? 0;
        modelMap.set(usage.model, entry);
      }
      totalTokens += dayTokens;
      tokensTrend.push({ timestamp: row.date, value: dayTokens });
    }

    const topModels: ModelUsage[] = Array.from(modelMap.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.tokens - a.tokens);

    // Top users from traces API (no metrics quota)
    let topUsers: TopUser[] = [];
    let activeUsersCount = 0;
    try {
      const traces = await langfuse.listTraces(100);
      const userMap = new Map<string, { traces: number; cost: number }>();
      for (const trace of traces.data) {
        if (!trace.userId) continue;
        const entry = userMap.get(trace.userId) ?? { traces: 0, cost: 0 };
        entry.traces++;
        entry.cost += trace.totalCost ?? 0;
        userMap.set(trace.userId, entry);
      }
      activeUsersCount = userMap.size;
      topUsers = Array.from(userMap.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.traces - a.traces)
        .slice(0, 10);
    } catch {
      // Graceful degradation
    }

    const response: UsageResponse = {
      totalTraces: {
        label: "Total Requests",
        value: totalTraces,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      totalTokens: {
        label: "Words Processed",
        value: totalTokens,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      activeUsers: {
        label: "Active Users",
        value: activeUsersCount,
        previousValue: null,
        unit: "number",
        trend: null,
      },
      tracesTrend,
      tokensTrend,
      topUsers,
      topModels,
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
