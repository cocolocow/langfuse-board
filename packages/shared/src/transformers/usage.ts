import type { LangfuseMetricsRow } from "../types/langfuse.js";

export interface ModelUsage {
  model: string;
  tokens: number;
  traces: number;
  cost: number;
}

export function formatTokens(_count: number): string {
  throw new Error("Not implemented");
}

export function aggregateUsageByModel(
  _rows: LangfuseMetricsRow[],
): ModelUsage[] {
  throw new Error("Not implemented");
}
