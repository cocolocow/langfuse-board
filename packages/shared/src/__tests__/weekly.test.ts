import { describe, it, expect } from "vitest";
import { compareWeekOverWeek } from "../transformers/weekly.js";
import type { TimeseriesPoint } from "../types/dashboard.js";

const day = (n: number, value: number): TimeseriesPoint => ({
  timestamp: `2026-05-${String(n).padStart(2, "0")}`,
  value,
});

describe("compareWeekOverWeek", () => {
  it("returns flat with null delta on empty input", () => {
    const r = compareWeekOverWeek([], 7);
    expect(r.current).toBe(0);
    expect(r.previous).toBe(0);
    expect(r.deltaPct).toBeNull();
    expect(r.direction).toBe("flat");
  });

  it("computes up delta when current > previous", () => {
    const points = [
      ...Array.from({ length: 7 }, (_, i) => day(i + 1, 5)), // previous
      ...Array.from({ length: 7 }, (_, i) => day(i + 8, 10)), // current
    ];
    const r = compareWeekOverWeek(points, 7);
    expect(r.current).toBe(70);
    expect(r.previous).toBe(35);
    expect(r.deltaPct).toBeCloseTo(100, 0);
    expect(r.direction).toBe("up");
  });

  it("computes down delta when current < previous", () => {
    const points = [
      ...Array.from({ length: 7 }, (_, i) => day(i + 1, 20)),
      ...Array.from({ length: 7 }, (_, i) => day(i + 8, 10)),
    ];
    const r = compareWeekOverWeek(points, 7);
    expect(r.deltaPct).toBeCloseTo(-50, 0);
    expect(r.direction).toBe("down");
  });

  it("returns flat when current == previous", () => {
    const points = Array.from({ length: 14 }, (_, i) => day(i + 1, 10));
    const r = compareWeekOverWeek(points, 7);
    expect(r.deltaPct).toBe(0);
    expect(r.direction).toBe("flat");
  });

  it("handles previous=0 (no division by zero, returns 100% up if current > 0)", () => {
    const points = [
      ...Array.from({ length: 7 }, (_, i) => day(i + 1, 0)),
      ...Array.from({ length: 7 }, (_, i) => day(i + 8, 50)),
    ];
    const r = compareWeekOverWeek(points, 7);
    expect(r.deltaPct).toBe(100);
    expect(r.direction).toBe("up");
  });
});
