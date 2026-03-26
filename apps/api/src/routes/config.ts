import { Hono } from "hono";
import type { LangfuseClient } from "../langfuse/client.js";
import type { BoardConfig } from "@langfuse-board/shared";
import { extractDiagnosticFields } from "../config/diagnostic.js";

export function createConfigRoutes(
  langfuse: LangfuseClient,
  boardConfig: BoardConfig,
) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json(boardConfig);
  });

  app.get("/diagnostic", async (c) => {
    const traces = await langfuse.listTraces(200);
    const diagnostic = extractDiagnosticFields(traces.data, boardConfig);
    return c.json(diagnostic);
  });

  return app;
}
