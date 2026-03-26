import type { LangfuseMetricsQuery, LangfuseMetricsResponse, BoardConfig } from "@langfuse-board/shared";
import type { ILangfuseClient } from "../../langfuse/client.js";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";

export function createMockLangfuse(
  handler: (query: LangfuseMetricsQuery) => LangfuseMetricsResponse,
): ILangfuseClient {
  return {
    queryMetrics: async (query: LangfuseMetricsQuery) => handler(query),
    getDailyMetrics: async () => ({
      data: [
        {
          date: "2024-01-15",
          countTraces: 500,
          countObservations: 1000,
          totalCost: 42.5,
          usage: [
            { model: "gpt-4", inputUsage: 100000, outputUsage: 30000, totalUsage: 130000, countTraces: 300, countObservations: 600, totalCost: 30 },
            { model: "gpt-3.5", inputUsage: 200000, outputUsage: 60000, totalUsage: 260000, countTraces: 200, countObservations: 400, totalCost: 12.5 },
          ],
        },
      ],
    }),
    listTraces: async () => ({ data: [] }),
    healthCheck: async () => true,
  } satisfies ILangfuseClient;
}

export function createTestApp(
  handler: (query: LangfuseMetricsQuery) => LangfuseMetricsResponse,
  boardConfig?: BoardConfig,
) {
  const langfuse = createMockLangfuse(handler);
  const cache = new InMemoryCache();
  const app = createApp({ langfuse, cache, boardConfig: boardConfig ?? DEFAULT_CONFIG });
  return { app, cache, langfuse };
}

export const defaultQuery = "?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z";

export function queryKey(query: LangfuseMetricsQuery): string {
  const dims = query.dimensions?.map((d) => d.field).join(",") ?? "none";
  const metrics = query.metrics.map((m) => `${m.aggregation}_${m.measure}`).join(",");
  const time = query.timeDimension ? `_t:${query.timeDimension.granularity}` : "";
  return `${query.view}:${dims}:${metrics}${time}`;
}
