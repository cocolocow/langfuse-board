import type { TrendDirection, CostBreakdown, TimeseriesPoint } from "../types/dashboard.js";
import type { LangfuseMetricsRow } from "../types/langfuse.js";

export function formatCost(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

export function calculateDelta(
  current: number,
  previous: number,
): { value: number; direction: TrendDirection } {
  if (current === previous) {
    return { value: 0, direction: "flat" };
  }

  if (previous === 0) {
    return { value: current > 0 ? 100 : -100, direction: current > 0 ? "up" : "down" };
  }

  const delta = ((current - previous) / previous) * 100;
  const direction: TrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { value: delta, direction };
}

export function projectMonthlyCost(dailyCosts: TimeseriesPoint[]): number {
  if (dailyCosts.length === 0) return 0;

  const totalCost = dailyCosts.reduce((sum, point) => sum + point.value, 0);
  const avgDailyCost = totalCost / dailyCosts.length;

  const firstDate = new Date(dailyCosts[0]!.timestamp);
  const year = firstDate.getFullYear();
  const month = firstDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return avgDailyCost * daysInMonth;
}

export function aggregateCostByModel(rows: LangfuseMetricsRow[]): CostBreakdown[] {
  if (rows.length === 0) return [];

  const totalCost = rows.reduce(
    (sum, row) => sum + (Number(row["sum_totalCost"]) || 0),
    0,
  );

  return rows
    .map((row) => {
      const cost = Number(row["sum_totalCost"]) || 0;
      return {
        name: String(row["providedModelName"] ?? "unknown"),
        cost,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        tokens: Number(row["sum_totalTokens"]) || 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}
