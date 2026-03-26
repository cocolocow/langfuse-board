import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import type { HealthResponse } from "@langfuse-board/shared";

export function createHealthRoutes(
  langfuse: LangfuseClient,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", async (c) => {
    const langfuseOk = await langfuse.healthCheck();

    const response: HealthResponse = {
      status: langfuseOk ? "ok" : "error",
      langfuse: langfuseOk,
      cacheSize: cache.size(),
    };

    return c.json(response);
  });

  return app;
}
