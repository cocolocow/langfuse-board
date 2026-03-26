import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { LangfuseClient } from "./langfuse/client.js";
import type { CacheStore } from "./cache/store.js";
import type { BoardConfig } from "@langfuse-board/shared";
import { errorHandler } from "./middleware/error.js";
import { createOverviewRoutes } from "./routes/overview.js";
import { createCostsRoutes } from "./routes/costs.js";
import { createUsageRoutes } from "./routes/usage.js";
import { createQualityRoutes } from "./routes/quality.js";
import { createHealthRoutes } from "./routes/health.js";
import { createFeedRoutes } from "./routes/feed.js";
import { createConfigRoutes } from "./routes/config.js";
import { createBreakdownRoutes } from "./routes/breakdown.js";

interface AppDeps {
  langfuse: LangfuseClient;
  cache: CacheStore;
  boardConfig: BoardConfig;
}

export function createApp({ langfuse, cache, boardConfig }: AppDeps) {
  const app = new Hono();

  app.use("*", cors());
  app.use("*", logger());
  app.onError(errorHandler);

  app.route("/api/overview", createOverviewRoutes(langfuse, cache));
  app.route("/api/costs", createCostsRoutes(langfuse, cache));
  app.route("/api/usage", createUsageRoutes(langfuse, cache));
  app.route("/api/quality", createQualityRoutes(langfuse, cache));
  app.route("/api/feed", createFeedRoutes(langfuse, cache, boardConfig));
  app.route("/api/config", createConfigRoutes(langfuse, boardConfig, cache));
  app.route("/api/breakdown", createBreakdownRoutes(langfuse, cache, boardConfig));
  app.route("/api/health", createHealthRoutes(langfuse, cache));

  return app;
}
