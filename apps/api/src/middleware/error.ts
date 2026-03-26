import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[error] ${err.message}`);

  if (err.message.includes("Rate limited")) {
    return c.json({ error: "Langfuse rate limit exceeded" }, 429);
  }

  if (err.message.includes("Langfuse API error")) {
    return c.json({ error: "Langfuse connection error", details: err.message }, 502);
  }

  return c.json({ error: "Internal server error" }, 500);
};
