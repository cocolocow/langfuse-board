import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import {
  dateRangeSchema,
  projectMonthlyCost,
} from "@langfuse-board/shared";
import type {
  CostsResponse,
  TimeseriesPoint,
  CostBreakdown,
} from "@langfuse-board/shared";

export function createCostsRoutes(
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
    const cacheKey = `costs:${from}:${to}`;

    const cached = cache.get<CostsResponse>(cacheKey);
    if (cached) return c.json(cached);

    // Daily Metrics API — zero metrics quota cost
    const daily = await langfuse.getDailyMetrics({ from, to });

    let totalCost = 0;
    const trend: TimeseriesPoint[] = [];
    const modelCosts = new Map<string, { cost: number; tokens: number }>();

    for (const row of daily.data) {
      totalCost += row.totalCost ?? 0;
      trend.push({ timestamp: row.date, value: row.totalCost ?? 0 });

      for (const usage of row.usage ?? []) {
        const entry = modelCosts.get(usage.model) ?? { cost: 0, tokens: 0 };
        entry.cost += usage.totalCost ?? 0;
        entry.tokens += usage.totalUsage ?? 0;
        modelCosts.set(usage.model, entry);
      }
    }

    const projected = projectMonthlyCost(trend);

    const byModel: CostBreakdown[] = Array.from(modelCosts.entries())
      .map(([name, { cost, tokens }]) => ({
        name,
        cost,
        tokens,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    const response: CostsResponse = {
      total: {
        label: "Total Cost",
        value: totalCost,
        previousValue: null,
        unit: "currency",
        trend: null,
      },
      projected: {
        label: "Projected Monthly",
        value: projected,
        previousValue: null,
        unit: "currency",
        trend: null,
      },
      byModel,
      byTraceName: [],
      trend,
      trendByModel: {},
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
