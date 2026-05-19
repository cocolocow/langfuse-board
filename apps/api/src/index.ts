import { serve } from "@hono/node-server";
import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { loadBoardConfig } from "./config/board.js";
import { LangfuseClient } from "./langfuse/client.js";
import { createMockLangfuseClient } from "./langfuse/mock.js";
import { InMemoryCache } from "./cache/memory.js";
import { createApp } from "./app.js";

const config = loadConfig();
const boardConfig = loadBoardConfig(resolve(import.meta.dirname, "../../.."));

const langfuse = config.LANGFUSE_MOCK
  ? createMockLangfuseClient()
  : new LangfuseClient({
      host: config.LANGFUSE_HOST,
      publicKey: config.LANGFUSE_PUBLIC_KEY,
      secretKey: config.LANGFUSE_SECRET_KEY,
    });

const cache = new InMemoryCache({
  // Persist to a JSON file at repo root so the cache survives board restarts.
  // Critical when Langfuse free-tier is rate-limited: the dashboard still has
  // the last known snapshot to display via the stale fallback.
  persistTo: process.env.CACHE_FILE ?? resolve(import.meta.dirname, "../../../.langfuse-board-cache.json"),
});
const app = createApp({ langfuse, cache, boardConfig });

const mode = config.LANGFUSE_MOCK ? " (mock data)" : "";

serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`langfuse-board API running on http://localhost:${info.port}${mode}`);
  console.log(`[config] Board: "${boardConfig.name}" with ${boardConfig.dimensions.length} dimensions`);
});
