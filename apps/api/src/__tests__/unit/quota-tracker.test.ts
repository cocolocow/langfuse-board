import { describe, it, expect, beforeEach, vi } from "vitest";
import { QuotaTracker } from "../../quota/tracker.js";

describe("QuotaTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts at zero", () => {
    const t = new QuotaTracker();
    expect(t.getUsageLast24h()).toBe(0);
    expect(t.getOldestCallInWindow()).toBeNull();
  });

  it("counts recent calls", () => {
    const t = new QuotaTracker();
    t.record();
    t.record();
    t.record();
    expect(t.getUsageLast24h()).toBe(3);
  });

  it("drops calls older than 24h from the rolling window", () => {
    const t = new QuotaTracker();
    vi.setSystemTime(new Date("2026-05-20T10:00:00Z"));
    t.record(); // 10:00 day 0
    t.record(); // 10:00 day 0
    vi.setSystemTime(new Date("2026-05-21T11:00:00Z")); // 25h later
    t.record(); // 11:00 day 1
    expect(t.getUsageLast24h()).toBe(1);
  });

  it("returns the oldest call inside the window", () => {
    const t = new QuotaTracker();
    vi.setSystemTime(new Date("2026-05-20T10:00:00Z"));
    t.record();
    const first = Date.now();
    vi.setSystemTime(new Date("2026-05-20T15:00:00Z"));
    t.record();
    expect(t.getOldestCallInWindow()).toBe(first);
  });

  it("reset() clears all recorded calls", () => {
    const t = new QuotaTracker();
    t.record();
    t.record();
    t.reset();
    expect(t.getUsageLast24h()).toBe(0);
  });
});
