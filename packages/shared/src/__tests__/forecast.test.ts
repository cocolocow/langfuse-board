import { describe, it, expect } from "vitest";
import { projectFromTimeseries } from "../transformers/forecast.js";
import type { TimeseriesPoint } from "../types/dashboard.js";

const day = (n: number, value: number): TimeseriesPoint => ({
  timestamp: `2026-05-${String(n).padStart(2, "0")}`,
  value,
});

describe("projectFromTimeseries", () => {
  it("returns zero projection on empty input", () => {
    const result = projectFromTimeseries([], [], 30);
    expect(result.current).toEqual({ cost: 0, traces: 0 });
    expect(result.projected).toEqual({ cost: 0, traces: 0 });
    expect(result.confidence).toBe(0);
  });

  it("extrapolates linearly from a single day", () => {
    const result = projectFromTimeseries([day(1, 10)], [day(1, 5)], 30);
    expect(result.current.cost).toBe(10);
    expect(result.projected.cost).toBeCloseTo(300, 0); // 10 * 30
    expect(result.projected.traces).toBeCloseTo(150, 0);
  });

  it("uses weighted average when we have at least 7 days", () => {
    const points = Array.from({ length: 7 }, (_, i) => day(i + 1, 10));
    const result = projectFromTimeseries(points, points, 30);
    expect(result.method).toBe("weighted_average");
    // 7 days × 10/day = 70 spent so far; projection: avg(10) × 30 = 300
    expect(result.projected.cost).toBeCloseTo(300, 0);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("biases towards recent days when usage is growing", () => {
    const growing = [
      day(1, 1), day(2, 2), day(3, 3),
      day(4, 5), day(5, 8), day(6, 13), day(7, 21),
    ];
    const result = projectFromTimeseries(growing, growing, 30);
    // Simple mean would be 53/7 ≈ 7.6 → 30 × 7.6 ≈ 228
    // Weighted toward last days should give clearly more
    expect(result.projected.cost).toBeGreaterThan(228);
  });

  it("handles all-zero series gracefully", () => {
    const zeros = Array.from({ length: 7 }, (_, i) => day(i + 1, 0));
    const result = projectFromTimeseries(zeros, zeros, 30);
    expect(result.projected.cost).toBe(0);
    expect(result.projected.traces).toBe(0);
  });

  it("never returns negative projections", () => {
    const negative = [day(1, -5), day(2, -3), day(3, -1)];
    const result = projectFromTimeseries(negative, negative, 30);
    expect(result.projected.cost).toBeGreaterThanOrEqual(0);
  });

  it("scales projection horizon (7 vs 30 days)", () => {
    const points = Array.from({ length: 7 }, (_, i) => day(i + 1, 10));
    const r30 = projectFromTimeseries(points, points, 30);
    const r7 = projectFromTimeseries(points, points, 7);
    expect(r30.projected.cost).toBeCloseTo(r7.projected.cost * (30 / 7), 0);
  });

  it("confidence drops with very short history", () => {
    const r1 = projectFromTimeseries([day(1, 10)], [day(1, 5)], 30);
    const r7 = projectFromTimeseries(
      Array.from({ length: 7 }, (_, i) => day(i + 1, 10)),
      Array.from({ length: 7 }, (_, i) => day(i + 1, 5)),
      30,
    );
    expect(r1.confidence).toBeLessThan(r7.confidence);
  });
});
