import type { TimeseriesPoint } from "../types/dashboard.js";
import type { Granularity } from "../types/langfuse.js";

export function fillMissingDataPoints(
  _series: TimeseriesPoint[],
  _from: string,
  _to: string,
  _granularity: Granularity,
): TimeseriesPoint[] {
  throw new Error("Not implemented");
}
