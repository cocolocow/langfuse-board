import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CacheStore } from "./store.js";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
}

interface InMemoryCacheOptions {
  /** Optional file path. When set, the cache is hydrated from this file on
   * construction and every `set()` schedules a debounced flush back to it.
   * Lets the dashboard survive board restarts: the last known snapshot is
   * still available as a stale fallback even when the in-memory store is
   * empty at boot and Langfuse is rate-limiting. */
  persistTo?: string;
}

export class InMemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private purgeInterval: ReturnType<typeof setInterval> | null = null;
  private persistTo: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Note: auto-purge is intentionally disabled. Expired entries stay in memory
  // so getStale() can serve them when Langfuse 429s. Memory pressure is not a
  // concern here — at most a few dozen distinct cache keys (route × date range).
  constructor(options: InMemoryCacheOptions = {}) {
    if (options.persistTo) {
      this.persistTo = resolve(options.persistTo);
      this.hydrateFromDisk();
    }
  }

  private hydrateFromDisk(): void {
    if (!this.persistTo) return;
    try {
      const raw = readFileSync(this.persistTo, "utf-8");
      const entries = JSON.parse(raw) as Array<[string, CacheEntry<unknown>]>;
      for (const [key, entry] of entries) {
        if (entry && typeof entry.cachedAt === "number") {
          this.store.set(key, entry);
        }
      }
      console.log(`[cache] hydrated ${entries.length} entries from ${this.persistTo}`);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        console.warn(`[cache] failed to hydrate from ${this.persistTo}:`, err);
      }
    }
  }

  private scheduleFlush(): void {
    if (!this.persistTo) return;
    if (this.flushTimer) return; // already scheduled
    // Debounce: coalesce multiple set() in the same tick into one disk write.
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushToDisk();
    }, 200);
  }

  private flushToDisk(): void {
    if (!this.persistTo) return;
    try {
      mkdirSync(dirname(this.persistTo), { recursive: true });
      const payload = JSON.stringify(Array.from(this.store.entries()));
      writeFileSync(this.persistTo, payload, "utf-8");
    } catch (err) {
      console.warn(`[cache] failed to persist to ${this.persistTo}:`, err);
    }
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
    this.scheduleFlush();
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
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
      this.flushToDisk(); // last-chance flush so no data is lost on shutdown
    }
    this.clear();
  }
}
