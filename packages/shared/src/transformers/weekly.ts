import type { TimeseriesPoint, WeeklyCompare, TrendDirection } from "../types/dashboard.js";

/**
 * Compare the last `windowDays` of a timeseries against the `windowDays` before that.
 * Used by the Trends page WoW/MoM toggles and by the Overview's "vs last period" KPI.
 *
 * `deltaPct` is null only when both windows are empty (no signal). When previous
 * is 0 and current > 0, returns 100% up to avoid Infinity in the UI.
 */
export function compareWeekOverWeek(
  points: TimeseriesPoint[],
  windowDays: number,
): WeeklyCompare {
  if (points.length === 0) {
    return { current: 0, previous: 0, deltaPct: null, direction: "flat" };
  }

  const sorted = [...points].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const currentWindow = sorted.slice(-windowDays);
  const previousWindow = sorted.slice(-2 * windowDays, -windowDays);

  const current = sum(currentWindow);
  const previous = sum(previousWindow);

  let deltaPct: number | null;
  let direction: TrendDirection;

  if (previous === 0 && current === 0) {
    deltaPct = 0;
    direction = "flat";
  } else if (previous === 0) {
    deltaPct = 100;
    direction = "up";
  } else {
    deltaPct = ((current - previous) / previous) * 100;
    if (Math.abs(deltaPct) < 0.5) {
      direction = "flat";
    } else if (deltaPct > 0) {
      direction = "up";
    } else {
      direction = "down";
    }
  }

  return { current, previous, deltaPct, direction };
}

function sum(points: TimeseriesPoint[]): number {
  return points.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
}
