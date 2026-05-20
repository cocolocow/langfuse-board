import type { Granularity } from "./langfuse.js";
import type {
  KpiData,
  TimeseriesPoint,
  CostBreakdown,
  TopUser,
  TopModel,
  ScoreSummary,
  FeatureRow,
  UserDetail,
  PersonaRow,
  AnomalyEvent,
  ForecastResult,
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

export interface FeedItem {
  id: string;
  timestamp: string;
  name: string;
  latencyMs: number;
  cost: number;
  status: "success" | "error";
  dimensions: Record<string, string | null>;
}

export interface FeedResponse {
  items: FeedItem[];
}

export interface HealthResponse {
  status: "ok" | "error";
  langfuse: boolean;
  cacheSize: number;
}

export interface FeaturesResponse {
  items: FeatureRow[];
  totalCost: number;
}

export interface UsersDetailResponse {
  items: UserDetail[];
}

export interface PersonasResponse {
  items: PersonaRow[];
}

export interface TimeseriesResponse {
  metric: "cost" | "tokens" | "traces";
  groupBy: "model" | "user" | "feature" | "persona" | "none";
  series: { label: string; points: TimeseriesPoint[] }[];
}

export interface AnomaliesResponse {
  items: AnomalyEvent[];
}

export interface ForecastResponse extends ForecastResult {
  /** Days the forecast was computed for (echoes the query param). */
  days: number;
}
