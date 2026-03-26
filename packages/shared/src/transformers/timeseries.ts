import type { TimeseriesPoint } from "../types/dashboard.js";
import type { Granularity } from "../types/langfuse.js";

function addInterval(date: Date, granularity: Granularity): Date {
  const next = new Date(date);
  switch (granularity) {
    case "hour":
      next.setUTCHours(next.getUTCHours() + 1);
      break;
    case "day":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "week":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "month":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
  }
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export function fillMissingDataPoints(
  series: TimeseriesPoint[],
  from: string,
  to: string,
  granularity: Granularity,
): TimeseriesPoint[] {
  const valueMap = new Map<string, number>();
  for (const point of series) {
    valueMap.set(point.timestamp, point.value);
  }

  const result: TimeseriesPoint[] = [];
  let current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    const key = formatDate(current);
    result.push({
      timestamp: key,
      value: valueMap.get(key) ?? 0,
    });
    current = addInterval(current, granularity);
  }

  return result;
}
