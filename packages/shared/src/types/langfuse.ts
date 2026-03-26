export type Granularity = "hour" | "day" | "week" | "month";

export type AggregationFn =
  | "sum"
  | "avg"
  | "count"
  | "max"
  | "min"
  | "p50"
  | "p75"
  | "p90"
  | "p95"
  | "p99";

export type MetricsView =
  | "traces"
  | "observations"
  | "scores-numeric"
  | "scores-categorical";

export interface LangfuseMetricsQuery {
  view: MetricsView;
  dimensions?: { field: string }[];
  metrics: { measure: string; aggregation: AggregationFn }[];
  filters?: { field: string; operator: string; value: unknown }[];
  timeDimension?: { granularity: Granularity };
  fromTimestamp: string;
  toTimestamp: string;
  orderBy?: { field: string; direction: "asc" | "desc" }[];
}

export interface LangfuseMetricsRow {
  [key: string]: unknown;
}

export interface LangfuseMetricsResponse {
  data: LangfuseMetricsRow[];
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface LangfuseDailyMetricsRow {
  date: string;
  countTraces: number;
  countObservations: number;
  totalCost: number;
  usage: {
    model: string;
    inputUsage: number;
    outputUsage: number;
    totalUsage: number;
    countTraces: number;
    countObservations: number;
    totalCost: number;
  }[];
}
