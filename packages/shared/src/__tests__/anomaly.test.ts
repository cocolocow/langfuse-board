import { describe, it, expect } from "vitest";
import { detectAnomalies } from "../transformers/anomaly.js";
import type { TimeseriesPoint } from "../types/dashboard.js";

const day = (n: number, value: number): TimeseriesPoint => ({
  timestamp: `2026-05-${String(n).padStart(2, "0")}`,
  value,
});

describe("detectAnomalies", () => {
  it("returns no anomalies on a perfectly stable series", () => {
    const stable = Array.from({ length: 14 }, (_, i) => day(i + 1, 10));
    expect(detectAnomalies(stable, "cost", 2)).toEqual([]);
  });

  it("flags a high outlier (3σ spike)", () => {
    const series = [
      ...Array.from({ length: 10 }, (_, i) => day(i + 1, 10)),
      day(11, 100),
    ];
    const anomalies = detectAnomalies(series, "cost", 2);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]!.date).toBe("2026-05-11");
    expect(anomalies[0]!.value).toBe(100);
    expect(anomalies[0]!.zScore).toBeGreaterThan(2);
  });

  it("flags a low outlier (drop to zero)", () => {
    const series = [
      ...Array.from({ length: 10 }, (_, i) => day(i + 1, 100)),
      day(11, 0),
    ];
    const anomalies = detectAnomalies(series, "cost", 2);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);
    expect(anomalies.some((a) => a.value === 0)).toBe(true);
  });

  it("returns empty on a series too short to estimate variance", () => {
    const tiny = [day(1, 10), day(2, 20)];
    expect(detectAnomalies(tiny, "cost", 2)).toEqual([]);
  });

  it("respects the zThreshold parameter", () => {
    // Series with non-zero variance so the threshold has actual bite
    const noisy = [5, 7, 6, 8, 9, 7, 6, 8, 7, 9, 14];
    const series = noisy.map((v, i) => day(i + 1, v));
    // mean≈7.6, std≈1.4, 14 → z≈4.6
    const strict = detectAnomalies(series, "cost", 10);
    expect(strict).toEqual([]);
    const loose = detectAnomalies(series, "cost", 2);
    expect(loose.length).toBeGreaterThan(0);
  });

  it("tags the anomaly dimension correctly", () => {
    const series = [
      ...Array.from({ length: 10 }, (_, i) => day(i + 1, 10)),
      day(11, 100),
    ];
    const anomalies = detectAnomalies(series, "feature:carousel_signature", 2);
    expect(anomalies[0]!.dimension).toBe("feature:carousel_signature");
  });
});
