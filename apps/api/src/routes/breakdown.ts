import { Hono } from "hono";
import { z } from "zod";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import type { BoardConfig, Dimension } from "@langfuse-board/shared";
import { dateRangeSchema } from "@langfuse-board/shared";

export interface BreakdownItem {
  name: string;
  cost: number;
  count: number;
  percentage: number;
}

export interface BreakdownResponse {
  dimension: { key: string; label: string };
  items: BreakdownItem[];
}

const breakdownQuerySchema = dateRangeSchema.extend({
  key: z.string().min(1),
});

export function createBreakdownRoutes(
  langfuse: ILangfuseClient,
  cache: CacheStore,
  boardConfig: BoardConfig,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const parsed = breakdownQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", details: parsed.error.issues }, 400);
    }

    const { key, from, to } = parsed.data;

    const dim = boardConfig.dimensions.find(
      (d) => d.key === key && d.show.includes("breakdown"),
    );
    if (!dim) {
      return c.json({ error: `Dimension "${key}" not found or not configured for breakdown` }, 400);
    }

    const cacheKey = `breakdown:${key}:${from}:${to}`;
    const cached = cache.get<BreakdownResponse>(cacheKey);
    if (cached) return c.json(cached);

    const items =
      dim.source === "trace"
        ? await breakdownByTraceField(langfuse, dim, from, to)
        : await breakdownByMetadata(langfuse, dim, from, to);

    const response: BreakdownResponse = {
      dimension: { key: dim.key, label: dim.label },
      items,
    };

    const ttl = isHistorical(to) ? 3_600_000 : 300_000;
    cache.set(cacheKey, response, ttl);

    return c.json(response);
  });

  return app;
}

async function breakdownByTraceField(
  langfuse: ILangfuseClient,
  dim: Dimension,
  from: string,
  to: string,
): Promise<BreakdownItem[]> {
  const view = dim.key === "providedModelName" ? "observations" as const : "traces" as const;

  const res = await langfuse.queryMetrics({
    view,
    dimensions: [{ field: dim.key }],
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "count", aggregation: "count" },
    ],
    fromTimestamp: from,
    toTimestamp: to,
  });

  const totalCost = res.data.reduce(
    (sum, row) => sum + (Number(row["sum_totalCost"]) || 0),
    0,
  );

  return res.data
    .map((row) => {
      const cost = Number(row["sum_totalCost"]) || 0;
      return {
        name: String(row[dim.key] ?? "unknown"),
        cost,
        count: Number(row["count_count"]) || 0,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      };
    })
    .filter((item) => item.name !== "null" && item.name !== "unknown")
    .sort((a, b) => b.cost - a.cost);
}

async function breakdownByMetadata(
  langfuse: ILangfuseClient,
  dim: Dimension,
  from: string,
  to: string,
): Promise<BreakdownItem[]> {
  const traces = await langfuse.listTraces(100);

  const fromDate = new Date(from).getTime();
  const toDate = new Date(to).getTime();

  const grouped = new Map<string, { cost: number; count: number }>();

  for (const trace of traces.data) {
    const traceTime = new Date(trace.timestamp).getTime();
    if (traceTime < fromDate || traceTime > toDate) continue;

    const meta = trace.metadata as Record<string, unknown> | null;
    const value = meta?.[dim.key];
    if (value == null) continue;

    const key = String(value);
    const entry = grouped.get(key) ?? { cost: 0, count: 0 };
    entry.cost += trace.totalCost ?? 0;
    entry.count++;
    grouped.set(key, entry);
  }

  const totalCost = Array.from(grouped.values()).reduce((s, e) => s + e.cost, 0);

  return Array.from(grouped.entries())
    .map(([name, { cost, count }]) => ({
      name,
      cost,
      count,
      percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
}

function isHistorical(to: string): boolean {
  const toDate = new Date(to);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDate < yesterday;
}
