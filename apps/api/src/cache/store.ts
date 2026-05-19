export interface CacheStore {
  get<T>(key: string): T | undefined;
  /** Return the cached value ignoring its TTL. Used as a "stale-while-error" fallback
   * when Langfuse returns 429 so the dashboard keeps showing the last known data. */
  getStale<T>(key: string): T | undefined;
  /** Epoch ms when this key was last fetched, or undefined if never. Used to render
   * a "last refreshed N min ago" indicator next to the manual refresh button. */
  getCachedAt(key: string): number | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
}
