export type TrendDirection = "up" | "down" | "flat";

export interface KpiData {
  label: string;
  value: number;
  previousValue: number | null;
  unit: "currency" | "number" | "percent" | "duration";
  trend: {
    direction: TrendDirection;
    delta: number;
  } | null;
}

export interface TimeseriesPoint {
  timestamp: string;
  value: number;
}

export interface CostBreakdown {
  name: string;
  cost: number;
  percentage: number;
  tokens: number;
}

export interface UsageSummary {
  totalTraces: number;
  totalTokens: number;
  activeUsers: number;
}

export interface TopUser {
  userId: string;
  traces: number;
  cost: number;
}

export interface TopModel {
  model: string;
  tokens: number;
  traces: number;
  cost: number;
}

export interface ScoreSummary {
  name: string;
  avg: number;
  count: number;
}

/** A business "feature" rolled up from many traces sharing the same `purpose`
 * (eg. carousel_signature, chat_pipeline, infographic_generation). Used by the
 * Features page to answer "what is costing me the most?". */
export interface FeatureRow {
  name: string;
  purpose: string;
  cost: number;
  count: number;
  /** Percentage change vs the previous 7-day window. Null when there isn't enough
   * history to make a meaningful comparison. */
  trendLastWeek: number | null;
  topUser: string | null;
  topPersona: string | null;
}

/** Deep profile of a single user — which features they use, on which personas,
 * how their cost evolves daily. Powers the Users page drill-down. */
export interface UserDetail {
  userName: string;
  userId: string;
  accountName: string;
  totalCost: number;
  totalTraces: number;
  lastSeen: string;
  topFeatures: { name: string; cost: number; count: number }[];
  topPersonas: { persona: string; cost: number }[];
  costTrend7d: TimeseriesPoint[];
}

/** Persona-level aggregate. The product has ~11 personas (Steve, Jordan, MrBeast…),
 * this answers "which one is actually being used and on what". */
export interface PersonaRow {
  persona: string;
  cost: number;
  count: number;
  topFeatures: { name: string; cost: number }[];
  topUsers: { user: string; cost: number }[];
  costTrend7d: TimeseriesPoint[];
}

/** A data point that fell outside the expected range based on rolling statistics.
 * Surfaced on the Overview to grab attention when something blows up. */
export interface AnomalyEvent {
  date: string;
  /** "feature:carousel_signature" | "user:Coco" — namespaced so the UI can route. */
  dimension: string;
  value: number;
  expectedRange: [number, number];
  zScore: number;
}

/** Projection of total cost/traces for an upcoming N-day window, computed from
 * the recent trend. Confidence is a heuristic [0..1]. */
export interface ForecastResult {
  current: { cost: number; traces: number };
  projected: { cost: number; traces: number };
  method: "linear" | "weighted_average";
  confidence: number;
}

/** Result of comparing the last N days against the previous N days. Used by
 * WoWCompare component to show side-by-side deltas. */
export interface WeeklyCompare {
  current: number;
  previous: number;
  deltaPct: number | null;
  direction: TrendDirection;
}
