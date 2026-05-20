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

/** Local estimate of how many Langfuse API calls we've burned in the last 24h.
 * Langfuse Cloud doesn't expose a RateLimit-Remaining header on 200s, so the
 * board counts its own outbound calls. The percentage is a rough planner —
 * it ignores other clients hitting the same project. */
export interface QuotaStatusResponse {
  usedLast24h: number;
  dailyLimit: number;
  /** Epoch ms of the oldest call inside the window. Useful for ETA. */
  oldestCallAt: number | null;
}
