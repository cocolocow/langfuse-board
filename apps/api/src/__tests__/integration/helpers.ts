import type { LangfuseMetricsQuery, LangfuseMetricsResponse } from "@langfuse-board/shared";
import type { LangfuseClient } from "../../langfuse/client.js";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";

export function createMockLangfuse(
  handler: (query: LangfuseMetricsQuery) => LangfuseMetricsResponse,
): LangfuseClient {
  return {
    queryMetrics: async (query: LangfuseMetricsQuery) => handler(query),
    healthCheck: async () => true,
  } as LangfuseClient;
}

export function createTestApp(handler: (query: LangfuseMetricsQuery) => LangfuseMetricsResponse) {
  const langfuse = createMockLangfuse(handler);
  const cache = new InMemoryCache();
  const app = createApp(langfuse, cache);
  return { app, cache };
}

export const defaultQuery = "?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z";

export function queryKey(query: LangfuseMetricsQuery): string {
  const dims = query.dimensions?.map((d) => d.field).join(",") ?? "none";
  const metrics = query.metrics.map((m) => `${m.aggregation}_${m.measure}`).join(",");
  const time = query.timeDimension ? `_t:${query.timeDimension.granularity}` : "";
  return `${query.view}:${dims}:${metrics}${time}`;
}
