import type { CacheStore } from "./store.js";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
}

export class InMemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private purgeInterval: ReturnType<typeof setInterval> | null = null;

  // Note: auto-purge is intentionally disabled. Expired entries stay in memory
  // so getStale() can serve them when Langfuse 429s. Memory pressure is not a
  // concern here — at most a few dozen distinct cache keys (route × date range).
  constructor(_purgeIntervalMs = 60_000) {
    // Kept for API compatibility but no longer scheduled.
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      // Don't delete — keep the value around so getStale() can serve it
      // as a fallback when Langfuse rate-limits us. The purge loop has been
      // disabled for the same reason.
      return undefined;
    }

    return entry.data as T;
  }

  getStale<T>(key: string): T | undefined {
    return (this.store.get(key)?.data as T | undefined) ?? undefined;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      data: value,
      expiresAt: now + ttlMs,
      cachedAt: now,
    });
  }

  getCachedAt(key: string): number | undefined {
    return this.store.get(key)?.cachedAt;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.purgeInterval) clearInterval(this.purgeInterval);
    this.clear();
  }
}
