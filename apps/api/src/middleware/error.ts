import type { ErrorHandler } from "hono";
import { LangfuseRateLimitError } from "../langfuse/client.js";
import { NoDataAvailableError } from "../cache/with-stale-fallback.js";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof NoDataAvailableError) {
    // Cold-cache state in manual mode. Not an error — the frontend interprets
    // 204 as "show the empty-state hint, prompt the user to click Refresh".
    return c.body(null, 204);
  }

  console.error(`[error] ${err.message}`);

  if (err instanceof LangfuseRateLimitError) {
    if (err.retryAfterSeconds != null) {
      c.header("X-Retry-After-Seconds", String(err.retryAfterSeconds));
      c.header("Retry-After", String(err.retryAfterSeconds));
    }
    return c.json(
      { error: "Langfuse rate limit exceeded", retryAfterSeconds: err.retryAfterSeconds },
      429,
    );
  }

  // Defensive fallback for any other "Rate limited"-shaped error
  if (err.message.includes("Rate limited")) {
    return c.json({ error: "Langfuse rate limit exceeded" }, 429);
  }

  if (err.message.includes("Langfuse API error")) {
    return c.json({ error: "Langfuse connection error", details: err.message }, 502);
  }

  return c.json({ error: "Internal server error" }, 500);
};
