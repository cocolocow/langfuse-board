import { Hono } from "hono";
import type { ILangfuseClient } from "../langfuse/client.js";
import type { CacheStore } from "../cache/store.js";
import type { BoardConfig, DiagnosticResponse } from "@langfuse-board/shared";
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

    const cached = cache.get<DiagnosticResponse>(cacheKey);
    if (cached) return c.json(cached);

    const traces = await langfuse.listTraces(100);
    const diagnostic = extractDiagnosticFields(traces.data, boardConfig);

    cache.set(cacheKey, diagnostic, 1_800_000);

    return c.json(diagnostic);
  });

  return app;
}
