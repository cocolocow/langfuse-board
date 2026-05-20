import type { Context } from "hono";
import type { CacheStore } from "./store.js";
import { LangfuseRateLimitError } from "../langfuse/client.js";

/** Raised when manual-fetch mode hits a cold cache. The board renders an
 * "aucune donnée — cliquer Rafraîchir" placeholder instead of silently
 * triggering a Langfuse call the user didn't ask for. */
export class NoDataAvailableError extends Error {
  constructor() {
    super("No cached data available — manual refresh required");
    this.name = "NoDataAvailableError";
  }
}

interface ServeOptions {
  /** When true, skip the cache and fetch fresh. Triggered by `?force=true`
   * on the query string. Stale fallback still applies if Langfuse 429s. */
  force?: boolean;
}

/**
 * Manual-fetch-with-stale-fallback helper for Langfuse-backed routes.
 *
 * Philosophy: the user owns when Langfuse gets hit. The board itself never
 * silently fetches — page loads serve whatever the cache has (fresh OR stale,
 * doesn't matter), and only the explicit Rafraîchir button passes `force=true`
 * which is the sole trigger of an actual outbound call.
 *
 * Behavior:
 *   - Default (no force): return whatever the cache has. Fresh first, stale
 *     fallback if expired. If nothing at all → throw NoDataAvailableError →
 *     the frontend shows a "click Rafraîchir to load" empty state.
 *   - force=true: bypass cache, fetch fresh from Langfuse, cache the result.
 *     If Langfuse 429s, fall back to stale (with retry-after countdown header).
 *
 * Always sets `X-Cached-At` (ISO timestamp) and `X-Stale` when relevant so the
 * frontend can show "données du HH:MM" next to the refresh button.
 */
export async function serveOrStale<T>(
  c: Context,
  cache: CacheStore,
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options: ServeOptions = {},
): Promise<T> {
  const setCachedAtHeader = (epochMs: number | undefined) => {
    if (epochMs !== undefined) {
      c.header("X-Cached-At", new Date(epochMs).toISOString());
    }
  };

  if (!options.force) {
    // Manual mode: never call Langfuse. Serve fresh, fall back to stale, fail
    // with NoDataAvailableError if both are empty.
    const fresh = cache.get<T>(cacheKey);
    if (fresh !== undefined) {
      setCachedAtHeader(cache.getCachedAt(cacheKey));
      return fresh;
    }
    const stale = cache.getStale<T>(cacheKey);
    if (stale !== undefined) {
      c.header("X-Stale", "true");
      setCachedAtHeader(cache.getCachedAt(cacheKey));
      return stale;
    }
    throw new NoDataAvailableError();
  }

  // force=true: explicit user-driven refresh — fetch from Langfuse.
  try {
    const value = await fetcher();
    cache.set(cacheKey, value, ttlMs);
    setCachedAtHeader(cache.getCachedAt(cacheKey));
    return value;
  } catch (err) {
    const isRateLimit =
      err instanceof LangfuseRateLimitError ||
      (err instanceof Error && /rate[- ]?limit/i.test(err.message));
    if (!isRateLimit) throw err;

    // Propagate the precise retry-after Langfuse gave us, so the frontend can
    // render a countdown instead of a generic "rate limit reached" wall.
    if (err instanceof LangfuseRateLimitError && err.retryAfterSeconds != null) {
      c.header("X-Retry-After-Seconds", String(err.retryAfterSeconds));
    }

    const stale = cache.getStale<T>(cacheKey);
    if (stale === undefined) throw err;

    c.header("X-Stale", "true");
    setCachedAtHeader(cache.getCachedAt(cacheKey));
    return stale;
  }
}

/** Read the `?force=true` flag from a Hono context. Centralised so each route
 * doesn't reimplement the parsing. */
export function isForceRefresh(c: Context): boolean {
  return c.req.query("force") === "true" || c.req.query("force") === "1";
}
