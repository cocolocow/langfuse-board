import { describe, it, expect } from "vitest";
import {
  formatCost,
  calculateDelta,
  projectMonthlyCost,
  aggregateCostByModel,
} from "../transformers/cost.js";
import type { TimeseriesPoint } from "../types/dashboard.js";
import type { LangfuseMetricsRow } from "../types/langfuse.js";

describe("formatCost", () => {
  it("formats zero", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("formats small amounts", () => {
    expect(formatCost(0.005)).toBe("$0.01");
  });

  it("formats regular amounts", () => {
    expect(formatCost(12.5)).toBe("$12.50");
  });

  it("formats large amounts with comma separators", () => {
    expect(formatCost(1234.56)).toBe("$1,234.56");
  });

  it("formats very large amounts", () => {
    expect(formatCost(123456.789)).toBe("$123,456.79");
  });

  it("handles negative values", () => {
    expect(formatCost(-42.5)).toBe("-$42.50");
  });
});

describe("calculateDelta", () => {
  it("returns up when current > previous", () => {
    const result = calculateDelta(150, 100);
    expect(result.direction).toBe("up");
    expect(result.value).toBeCloseTo(50);
  });

  it("returns down when current < previous", () => {
    const result = calculateDelta(80, 100);
    expect(result.direction).toBe("down");
    expect(result.value).toBeCloseTo(-20);
  });

  it("returns flat when current === previous", () => {
    const result = calculateDelta(100, 100);
    expect(result.direction).toBe("flat");
    expect(result.value).toBe(0);
  });

  it("handles zero previous (avoids division by zero)", () => {
    const result = calculateDelta(50, 0);
    expect(result.direction).toBe("up");
    expect(result.value).toBe(100);
  });

  it("handles both zero", () => {
    const result = calculateDelta(0, 0);
    expect(result.direction).toBe("flat");
    expect(result.value).toBe(0);
  });
});

describe("projectMonthlyCost", () => {
  it("projects from partial month data", () => {
    const dailyCosts: TimeseriesPoint[] = [
      { timestamp: "2024-01-01", value: 10 },
      { timestamp: "2024-01-02", value: 12 },
      { timestamp: "2024-01-03", value: 8 },
      { timestamp: "2024-01-04", value: 10 },
      { timestamp: "2024-01-05", value: 11 },
    ];
    // Average daily cost = 10.2, projected = 10.2 * 31 = 316.2
    const projected = projectMonthlyCost(dailyCosts);
    expect(projected).toBeCloseTo(316.2, 0);
  });

  it("returns 0 for empty data", () => {
    expect(projectMonthlyCost([])).toBe(0);
  });

  it("handles single day", () => {
    const dailyCosts: TimeseriesPoint[] = [
      { timestamp: "2024-02-15", value: 50 },
    ];
    // February 2024 has 29 days (leap year)
    expect(projectMonthlyCost(dailyCosts)).toBeCloseTo(50 * 29, 0);
  });
});

describe("aggregateCostByModel", () => {
  it("aggregates rows into cost breakdowns", () => {
    const rows: LangfuseMetricsRow[] = [
      { providedModelName: "gpt-4", sum_totalCost: 100, sum_totalTokens: 50000 },
      { providedModelName: "gpt-3.5-turbo", sum_totalCost: 20, sum_totalTokens: 200000 },
      { providedModelName: "claude-3-sonnet", sum_totalCost: 80, sum_totalTokens: 100000 },
    ];

    const result = aggregateCostByModel(rows);

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe("gpt-4");
    expect(result[0]!.cost).toBe(100);
    expect(result[0]!.percentage).toBeCloseTo(50);
    expect(result[1]!.name).toBe("claude-3-sonnet");
    expect(result[1]!.cost).toBe(80);
    expect(result[2]!.name).toBe("gpt-3.5-turbo");
  });

  it("returns empty array for empty input", () => {
    expect(aggregateCostByModel([])).toEqual([]);
  });

  it("handles single model", () => {
    const rows: LangfuseMetricsRow[] = [
      { providedModelName: "gpt-4", sum_totalCost: 100, sum_totalTokens: 50000 },
    ];

    const result = aggregateCostByModel(rows);
    expect(result).toHaveLength(1);
    expect(result[0]!.percentage).toBe(100);
  });
});
