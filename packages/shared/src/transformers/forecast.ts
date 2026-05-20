import type { ForecastResult, TimeseriesPoint } from "../types/dashboard.js";

/**
 * Project cost + traces over the next `days` window from two parallel daily series.
 *
 * Strategy:
 *  - Empty input → all zeros, zero confidence.
 *  - 1-6 days of history → naive linear extrapolation (low confidence).
 *  - ≥7 days → exponentially weighted recent average (more weight to last 3 days),
 *    so a growing trend bends the projection upward rather than diluting it
 *    into a flat mean.
 *
 * Confidence is a crude heuristic: more history + lower variance → higher.
 * Never returns negative values (rate-limit edge cases sometimes inject negatives).
 */
export function projectFromTimeseries(
  costPoints: TimeseriesPoint[],
  tracePoints: TimeseriesPoint[],
  days: number,
): ForecastResult {
  const costNow = sum(costPoints);
  const tracesNow = sum(tracePoints);

  if (costPoints.length === 0 && tracePoints.length === 0) {
    return {
      current: { cost: 0, traces: 0 },
      projected: { cost: 0, traces: 0 },
      method: "linear",
      confidence: 0,
    };
  }

  const haveEnough = costPoints.length >= 7 || tracePoints.length >= 7;
  const method: ForecastResult["method"] = haveEnough ? "weighted_average" : "linear";

  const projectedCost = Math.max(0, dailyRate(costPoints, method) * days);
  const projectedTraces = Math.max(0, dailyRate(tracePoints, method) * days);

  const confidence = computeConfidence(costPoints);

  return {
    current: { cost: costNow, traces: tracesNow },
    projected: { cost: projectedCost, traces: projectedTraces },
    method,
    confidence,
  };
}

function sum(points: TimeseriesPoint[]): number {
  return points.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
}

function dailyRate(points: TimeseriesPoint[], method: "linear" | "weighted_average"): number {
  if (points.length === 0) return 0;
  if (method === "linear") {
    // Simple mean over whatever we have
    return sum(points) / points.length;
  }
  // Weighted average: weights = [1, 1, 1, 1, 2, 3, 4] (more weight on recent days)
  // Take the last 7 points (we already know length ≥ 7).
  const recent = points.slice(-7);
  const weights = [1, 1, 1, 1, 2, 3, 4];
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < recent.length; i++) {
    const w = weights[i] ?? 1;
    weightedSum += (Number(recent[i]!.value) || 0) * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function computeConfidence(points: TimeseriesPoint[]): number {
  if (points.length === 0) return 0;
  const lengthScore = Math.min(1, points.length / 14); // 14 days = max confidence from history
  if (points.length < 2) return lengthScore * 0.3;
  // Coefficient of variation (std / mean) — lower CV = more confidence
  const values = points.map((p) => Math.max(0, Number(p.value) || 0));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return lengthScore * 0.5;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  const stabilityScore = Math.max(0, 1 - Math.min(1, cv));
  return Math.min(1, lengthScore * 0.5 + stabilityScore * 0.5);
}
