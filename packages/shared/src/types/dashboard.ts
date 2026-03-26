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
