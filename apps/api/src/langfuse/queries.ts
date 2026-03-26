import type { LangfuseMetricsQuery, Granularity } from "@langfuse-board/shared";

interface QueryParams {
  from: string;
  to: string;
  granularity?: Granularity;
}

export function costTotalQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "count", aggregation: "count" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function costTrendQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [{ measure: "totalCost", aggregation: "sum" }],
    timeDimension: { granularity: p.granularity ?? "day" },
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function costByModelQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "observations",
    dimensions: [{ field: "providedModelName" }],
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "totalTokens", aggregation: "sum" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function costByTraceNameQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    dimensions: [{ field: "name" }],
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "totalTokens", aggregation: "sum" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function tracesTrendQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [{ measure: "count", aggregation: "count" }],
    timeDimension: { granularity: p.granularity ?? "day" },
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function latencyQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [
      { measure: "latency", aggregation: "average" },
      { measure: "latency", aggregation: "p95" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function latencyTrendQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [
      { measure: "latency", aggregation: "average" },
      { measure: "latency", aggregation: "p95" },
    ],
    timeDimension: { granularity: p.granularity ?? "day" },
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function tokensTrendQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    metrics: [{ measure: "totalTokens", aggregation: "sum" }],
    timeDimension: { granularity: p.granularity ?? "day" },
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function usageByModelQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "observations",
    dimensions: [{ field: "providedModelName" }],
    metrics: [
      { measure: "totalTokens", aggregation: "sum" },
      { measure: "totalCost", aggregation: "sum" },
      { measure: "count", aggregation: "count" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}

export function usageByUserQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "traces",
    dimensions: [{ field: "userId" }],
    metrics: [
      { measure: "count", aggregation: "count" },
      { measure: "totalCost", aggregation: "sum" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
    orderBy: [{ field: "count", direction: "desc" }],
  };
}

export function scoresQuery(p: QueryParams): LangfuseMetricsQuery {
  return {
    view: "scores-numeric",
    dimensions: [{ field: "name" }],
    metrics: [
      { measure: "value", aggregation: "average" },
      { measure: "count", aggregation: "count" },
    ],
    fromTimestamp: p.from,
    toTimestamp: p.to,
  };
}
