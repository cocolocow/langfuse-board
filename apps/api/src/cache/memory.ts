import type { CacheStore } from "./store.js";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class InMemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private purgeInterval: ReturnType<typeof setInterval>;

  constructor(purgeIntervalMs = 60_000) {
    this.purgeInterval = setInterval(() => this.purge(), purgeIntervalMs);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + ttlMs,
    });
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
    this.purge();
    return this.store.size;
  }

  destroy(): void {
    clearInterval(this.purgeInterval);
    this.clear();
  }

  private purge(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
