import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import { serveOrStale } from "../cache/with-stale-fallback.js";
import type { BoardConfig } from "@langfuse-board/shared";
import { extractDiagnosticFields } from "../config/diagnostic.js";

export function createConfigRoutes(
  langfuse: ILangfuseClient,
  boardConfig: BoardConfig,
  cache: CacheStore,
) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json(boardConfig);
  });

  app.get("/diagnostic", async (c) => {
    const cacheKey = "config:diagnostic";
    // Cache 24h: detected fields change rarely (only when new metadata keys are emitted)
    const diagnostic = await serveOrStale(c, cache, cacheKey, 86_400_000, async () => {
      const traces = await langfuse.listTraces(100);
      return extractDiagnosticFields(traces.data, boardConfig);
    });
    return c.json(diagnostic);
  });

  return app;
}
