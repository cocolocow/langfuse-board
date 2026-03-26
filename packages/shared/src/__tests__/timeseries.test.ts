import { describe, it, expect } from "vitest";
import { fillMissingDataPoints } from "../transformers/timeseries.js";
import type { TimeseriesPoint } from "../types/dashboard.js";

describe("fillMissingDataPoints", () => {
  it("fills gaps in daily data with 0", () => {
    const series: TimeseriesPoint[] = [
      { timestamp: "2024-01-01", value: 10 },
      { timestamp: "2024-01-03", value: 30 },
    ];

    const result = fillMissingDataPoints(
      series,
      "2024-01-01",
      "2024-01-03",
      "day",
    );

    expect(result).toEqual([
      { timestamp: "2024-01-01", value: 10 },
      { timestamp: "2024-01-02", value: 0 },
      { timestamp: "2024-01-03", value: 30 },
    ]);
  });

  it("returns empty array for empty input with no range", () => {
    const result = fillMissingDataPoints([], "2024-01-01", "2024-01-01", "day");
    expect(result).toEqual([{ timestamp: "2024-01-01", value: 0 }]);
  });

  it("handles already complete data", () => {
    const series: TimeseriesPoint[] = [
      { timestamp: "2024-01-01", value: 10 },
      { timestamp: "2024-01-02", value: 20 },
      { timestamp: "2024-01-03", value: 30 },
    ];

    const result = fillMissingDataPoints(
      series,
      "2024-01-01",
      "2024-01-03",
      "day",
    );

    expect(result).toEqual(series);
  });

  it("fills weekly gaps", () => {
    const series: TimeseriesPoint[] = [
      { timestamp: "2024-01-01", value: 100 },
      { timestamp: "2024-01-15", value: 200 },
    ];

    const result = fillMissingDataPoints(
      series,
      "2024-01-01",
      "2024-01-15",
      "week",
    );

    expect(result).toHaveLength(3);
    expect(result[0]!.timestamp).toBe("2024-01-01");
    expect(result[1]!.timestamp).toBe("2024-01-08");
    expect(result[1]!.value).toBe(0);
    expect(result[2]!.timestamp).toBe("2024-01-15");
  });

  it("fills monthly gaps", () => {
    const series: TimeseriesPoint[] = [
      { timestamp: "2024-01-01", value: 100 },
      { timestamp: "2024-03-01", value: 300 },
    ];

    const result = fillMissingDataPoints(
      series,
      "2024-01-01",
      "2024-03-01",
      "month",
    );

    expect(result).toHaveLength(3);
    expect(result[1]!.timestamp).toBe("2024-02-01");
    expect(result[1]!.value).toBe(0);
  });
});
