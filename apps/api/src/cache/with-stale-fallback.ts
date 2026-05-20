import type { Context } from "hono";
import type { CacheStore } from "./store.js";
import { LangfuseRateLimitError } from "../langfuse/client.js";

interface ServeOptions {
  /** When true, skip the cache and fetch fresh. Triggered by `?force=true`
   * on the query string. Stale fallback still applies if Langfuse 429s. */
  force?: boolean;
}

/**
 * Stale-while-error helper for Langfuse-backed routes.
 *
 * Behavior:
 *   1. Return cached fresh value if present (unless `force`).
 *   2. Otherwise run `fetcher` to compute a new value.
 *      - On success: cache the value with `ttlMs` and return it.
 *      - On Langfuse 429 (or any error message containing "Rate limited"):
 *        fall back to the last known value (even if expired), tag the response
 *        with `X-Stale: true`, and return 200. The dashboard keeps showing the
 *        previous numbers instead of an empty "rate limit reached" screen.
 *      - If no stale value exists either, rethrow so the global error handler
 *        produces the usual 429 response.
 *
 * Always sets `X-Cached-At` (ISO timestamp) on the response so the frontend
 * can show "last refreshed N min ago" next to the manual refresh button.
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
    const fresh = cache.get<T>(cacheKey);
    if (fresh !== undefined) {
      setCachedAtHeader(cache.getCachedAt(cacheKey));
      return fresh;
    }
  }

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
