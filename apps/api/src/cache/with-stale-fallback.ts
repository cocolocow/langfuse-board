import type { Context } from "hono";
import type { CacheStore } from "./store.js";

/**
 * Stale-while-error helper for Langfuse-backed routes.
 *
 * Behavior:
 *   1. Return cached fresh value if present.
 *   2. Otherwise run `fetcher` to compute a new value.
 *      - On success: cache the value with `ttlMs` and return it.
 *      - On Langfuse 429 (or any error message containing "Rate limited"):
 *        fall back to the last known value (even if expired), tag the response
 *        with `X-Stale: true`, and return 200. The dashboard keeps showing the
 *        previous numbers instead of an empty "rate limit reached" screen.
 *      - If no stale value exists either, rethrow so the global error handler
 *        produces the usual 429 response.
 */
export async function serveOrStale<T>(
  c: Context,
  cache: CacheStore,
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const fresh = cache.get<T>(cacheKey);
  if (fresh !== undefined) {
    return fresh;
  }

  try {
    const value = await fetcher();
    cache.set(cacheKey, value, ttlMs);
    return value;
  } catch (err) {
    const isRateLimit =
      err instanceof Error && /rate[- ]?limit/i.test(err.message);
    if (!isRateLimit) throw err;

    const stale = cache.getStale<T>(cacheKey);
    if (stale === undefined) throw err;

    c.header("X-Stale", "true");
    return stale;
  }
}
