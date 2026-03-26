import { describe, it, expect } from "vitest";
import { formatTokens, aggregateUsageByModel } from "../transformers/usage.js";
import type { LangfuseMetricsRow } from "../types/langfuse.js";

describe("formatTokens", () => {
  it("formats small numbers as-is", () => {
    expect(formatTokens(500)).toBe("500");
  });

  it("formats thousands with K suffix", () => {
    expect(formatTokens(1500)).toBe("1.5K");
  });

  it("formats exact thousands", () => {
    expect(formatTokens(10000)).toBe("10K");
  });

  it("formats millions with M suffix", () => {
    expect(formatTokens(1500000)).toBe("1.5M");
  });

  it("formats billions with B suffix", () => {
    expect(formatTokens(2500000000)).toBe("2.5B");
  });

  it("handles zero", () => {
    expect(formatTokens(0)).toBe("0");
  });

  it("rounds to 1 decimal place", () => {
    expect(formatTokens(1234)).toBe("1.2K");
  });

  it("removes trailing .0", () => {
    expect(formatTokens(2000)).toBe("2K");
  });
});

describe("aggregateUsageByModel", () => {
  it("aggregates rows by model", () => {
    const rows: LangfuseMetricsRow[] = [
      { providedModelName: "gpt-4", sum_totalTokens: 50000, count: 100, sum_totalCost: 10 },
      { providedModelName: "gpt-3.5-turbo", sum_totalTokens: 200000, count: 500, sum_totalCost: 2 },
    ];

    const result = aggregateUsageByModel(rows);
    expect(result).toHaveLength(2);
    expect(result[0]!.model).toBe("gpt-3.5-turbo");
    expect(result[0]!.tokens).toBe(200000);
    expect(result[0]!.traces).toBe(500);
    expect(result[0]!.cost).toBe(2);
  });

  it("sorts by tokens descending", () => {
    const rows: LangfuseMetricsRow[] = [
      { providedModelName: "small", sum_totalTokens: 100, count: 1, sum_totalCost: 0.01 },
      { providedModelName: "big", sum_totalTokens: 100000, count: 50, sum_totalCost: 5 },
    ];

    const result = aggregateUsageByModel(rows);
    expect(result[0]!.model).toBe("big");
  });

  it("returns empty for empty input", () => {
    expect(aggregateUsageByModel([])).toEqual([]);
  });
});
