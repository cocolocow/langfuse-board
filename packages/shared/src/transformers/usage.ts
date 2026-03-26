import type { LangfuseMetricsRow } from "../types/langfuse.js";

export interface ModelUsage {
  model: string;
  tokens: number;
  traces: number;
  cost: number;
}

export function formatTokens(count: number): string {
  if (count === 0) return "0";

  const thresholds: { value: number; suffix: string }[] = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];

  for (const { value, suffix } of thresholds) {
    if (count >= value) {
      const formatted = (count / value).toFixed(1);
      return formatted.endsWith(".0")
        ? `${formatted.slice(0, -2)}${suffix}`
        : `${formatted}${suffix}`;
    }
  }

  return String(count);
}

export function aggregateUsageByModel(rows: LangfuseMetricsRow[]): ModelUsage[] {
  if (rows.length === 0) return [];

  return rows
    .map((row) => ({
      model: String(row["providedModelName"] ?? "unknown"),
      tokens: Number(row["sum_totalTokens"]) || 0,
      traces: Number(row["count"]) || 0,
      cost: Number(row["sum_totalCost"]) || 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);
}
