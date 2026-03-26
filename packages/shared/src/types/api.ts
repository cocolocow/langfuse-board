import type { Granularity } from "./langfuse.js";
import type {
  KpiData,
  TimeseriesPoint,
  CostBreakdown,
  TopUser,
  TopModel,
  ScoreSummary,
} from "./dashboard.js";

export interface DateRangeQuery {
  from: string;
  to: string;
  granularity?: Granularity;
}

export interface OverviewResponse {
  kpis: {
    totalCost: KpiData;
    totalTraces: KpiData;
    avgLatency: KpiData;
    errorRate: KpiData;
  };
  costTrend: TimeseriesPoint[];
  tracesTrend: TimeseriesPoint[];
}

export interface CostsResponse {
  total: KpiData;
  projected: KpiData;
  byModel: CostBreakdown[];
  byTraceName: CostBreakdown[];
  trend: TimeseriesPoint[];
  trendByModel: Record<string, TimeseriesPoint[]>;
}

export interface UsageResponse {
  totalTraces: KpiData;
  totalTokens: KpiData;
  activeUsers: KpiData;
  tracesTrend: TimeseriesPoint[];
  tokensTrend: TimeseriesPoint[];
  topUsers: TopUser[];
  topModels: TopModel[];
}

export interface QualityResponse {
  avgLatency: KpiData;
  p95Latency: KpiData;
  errorRate: KpiData;
  latencyTrend: TimeseriesPoint[];
  latencyByModel: Record<string, TimeseriesPoint[]>;
  scores: ScoreSummary[];
}

export interface HealthResponse {
  status: "ok" | "error";
  langfuse: boolean;
  cacheSize: number;
}
