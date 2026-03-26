import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";

describe("InMemoryCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new InMemoryCache();
  });

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it("stores and retrieves a value", () => {
    cache.set("key1", { data: "hello" }, 60_000);
    expect(cache.get("key1")).toEqual({ data: "hello" });
  });

  it("returns undefined for missing keys", () => {
    expect(cache.get("nope")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    cache.set("key1", "value", 5_000);
    expect(cache.get("key1")).toBe("value");

    vi.advanceTimersByTime(5_001);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("reports correct size", () => {
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    expect(cache.size()).toBe(2);
  });

  it("deletes a specific key", () => {
    cache.set("a", 1, 60_000);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("clears all entries", () => {
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it("has() returns true for existing keys", () => {
    cache.set("a", 1, 60_000);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  it("has() returns false for expired keys", () => {
    cache.set("a", 1, 1_000);
    vi.advanceTimersByTime(1_001);
    expect(cache.has("a")).toBe(false);
  });

  it("overwrites existing keys", () => {
    cache.set("a", 1, 60_000);
    cache.set("a", 2, 60_000);
    expect(cache.get("a")).toBe(2);
    expect(cache.size()).toBe(1);
  });

  it("purges expired entries periodically", () => {
    cache.set("a", 1, 2_000);
    cache.set("b", 2, 120_000);

    vi.advanceTimersByTime(60_001);
    expect(cache.size()).toBe(1);
    expect(cache.get("b")).toBe(2);
  });
});
