import type { TrendDirection, CostBreakdown, TimeseriesPoint } from "../types/dashboard.js";
import type { LangfuseMetricsRow } from "../types/langfuse.js";

export function formatCost(_cents: number): string {
  throw new Error("Not implemented");
}

export function calculateDelta(
  _current: number,
  _previous: number,
): { value: number; direction: TrendDirection } {
  throw new Error("Not implemented");
}

export function projectMonthlyCost(
  _dailyCosts: TimeseriesPoint[],
): number {
  throw new Error("Not implemented");
}

export function aggregateCostByModel(
  _rows: LangfuseMetricsRow[],
): CostBreakdown[] {
  throw new Error("Not implemented");
}
