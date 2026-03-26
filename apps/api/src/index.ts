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

const cache = new InMemoryCache();
const app = createApp({ langfuse, cache, boardConfig });

const mode = config.LANGFUSE_MOCK ? " (mock data)" : "";

serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`langfuse-board API running on http://localhost:${info.port}${mode}`);
  console.log(`[config] Board: "${boardConfig.name}" with ${boardConfig.dimensions.length} dimensions`);
});
