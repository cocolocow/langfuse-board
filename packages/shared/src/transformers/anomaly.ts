import type { AnomalyEvent, TimeseriesPoint } from "../types/dashboard.js";

/**
 * Detect points whose value falls outside `zThreshold` standard deviations from
 * the mean of the surrounding window. Compares each point against the stats of
 * ALL OTHER points (leave-one-out style), so a single huge spike doesn't poison
 * its own baseline.
 *
 * Returns empty when there aren't enough points to estimate variance (< 3).
 */
export function detectAnomalies(
  points: TimeseriesPoint[],
  dimension: string,
  zThreshold: number,
): AnomalyEvent[] {
  if (points.length < 3) return [];

  const values = points.map((p) => Number(p.value) || 0);
  const events: AnomalyEvent[] = [];

  for (let i = 0; i < points.length; i++) {
    const others = values.filter((_, j) => j !== i);
    const mean = others.reduce((a, b) => a + b, 0) / others.length;
    const variance =
      others.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / others.length;
    const std = Math.sqrt(variance);
    if (std === 0) {
      // Flat baseline: any deviation matters
      if (values[i] !== mean) {
        events.push({
          date: points[i]!.timestamp,
          dimension,
          value: values[i]!,
          expectedRange: [mean, mean],
          zScore: Infinity,
        });
      }
      continue;
    }
    const z = (values[i]! - mean) / std;
    if (Math.abs(z) >= zThreshold) {
      events.push({
        date: points[i]!.timestamp,
        dimension,
        value: values[i]!,
        expectedRange: [mean - zThreshold * std, mean + zThreshold * std],
        zScore: z,
      });
    }
  }

  return events;
}
