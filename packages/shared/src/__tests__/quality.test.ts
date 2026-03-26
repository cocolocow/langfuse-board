import { describe, it, expect } from "vitest";
import { calculateErrorRate, formatLatency } from "../transformers/quality.js";

describe("calculateErrorRate", () => {
  it("calculates percentage", () => {
    expect(calculateErrorRate(1000, 50)).toBeCloseTo(5);
  });

  it("returns 0 when no traces", () => {
    expect(calculateErrorRate(0, 0)).toBe(0);
  });

  it("returns 100 when all traces are errors", () => {
    expect(calculateErrorRate(100, 100)).toBe(100);
  });

  it("handles small fractions", () => {
    expect(calculateErrorRate(10000, 1)).toBeCloseTo(0.01);
  });
});

describe("formatLatency", () => {
  it("formats milliseconds below 1 second", () => {
    expect(formatLatency(340)).toBe("340ms");
  });

  it("formats seconds", () => {
    expect(formatLatency(1200)).toBe("1.2s");
  });

  it("formats exact seconds", () => {
    expect(formatLatency(2000)).toBe("2s");
  });

  it("formats large latencies in seconds", () => {
    expect(formatLatency(15750)).toBe("15.8s");
  });

  it("handles zero", () => {
    expect(formatLatency(0)).toBe("0ms");
  });

  it("rounds milliseconds to integers", () => {
    expect(formatLatency(340.7)).toBe("341ms");
  });
});
