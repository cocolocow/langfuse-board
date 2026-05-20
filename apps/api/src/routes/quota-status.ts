import { Hono } from "hono";
import { getQuotaTracker } from "../quota/tracker.js";
import type { QuotaStatusResponse } from "@langfuse-board/shared";

const DEFAULT_DAILY_LIMIT = Number(process.env.LANGFUSE_DAILY_LIMIT) || 100;

/**
 * Local estimate of Langfuse API quota usage over the trailing 24h window.
 *
 * Langfuse Cloud doesn't expose a `RateLimit-Remaining` header on successful
 * responses, so we count our own outbound calls. The estimate is reasonable
 * (the board is usually the only consumer of metrics/traces endpoints; trace
 * ingestion uses a separate quota bucket).
 *
 * No cache — this endpoint just reads in-memory state, the response is always
 * fresh and free.
 */
export function createQuotaStatusRoutes() {
  const app = new Hono();

  app.get("/", (c) => {
    const tracker = getQuotaTracker();
    const usedLast24h = tracker?.getUsageLast24h() ?? 0;
    const oldestCallAt = tracker?.getOldestCallInWindow() ?? null;
    const response: QuotaStatusResponse = {
      usedLast24h,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      oldestCallAt,
    };
    return c.json(response);
  });

  return app;
}
