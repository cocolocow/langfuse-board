import { describe, it, expect } from "vitest";
import { InMemoryCache } from "../../cache/memory.js";
import { createApp } from "../../app.js";
import { DEFAULT_CONFIG } from "../../config/board.js";
import type { LangfuseClient } from "../../langfuse/client.js";
import type { BoardConfig } from "@langfuse-board/shared";

function createConfigTestApp(boardConfig?: BoardConfig) {
  const langfuse = {
    queryMetrics: async () => ({ data: [] }),
    listTraces: async () => ({
      data: [
        {
          id: "t-1",
          timestamp: "2024-01-01T00:00:00Z",
          name: "chat",
          userId: "alice",
          latency: 1,
          totalCost: 0.01,
          metadata: { account_id: "acme", plan: "pro" },
          observations: [],
        },
        {
          id: "t-2",
          timestamp: "2024-01-01T00:00:01Z",
          name: "search",
          userId: "bob",
          latency: 0.5,
          totalCost: 0.005,
          metadata: { account_id: "beta" },
          observations: [],
        },
        {
          id: "t-3",
          timestamp: "2024-01-01T00:00:02Z",
          name: "chat",
          userId: null,
          latency: 2,
          totalCost: 0.02,
          metadata: null,
          observations: [],
        },
      ],
    }),
    healthCheck: async () => true,
  } as LangfuseClient;

  const cache = new InMemoryCache();
  return createApp({ langfuse, cache, boardConfig: boardConfig ?? DEFAULT_CONFIG });
}

describe("GET /api/config", () => {
  it("returns the board config", async () => {
    const customConfig: BoardConfig = {
      name: "My SaaS",
      dimensions: [
        { key: "userId", label: "User", source: "trace", show: ["feed"] },
        { key: "account_id", label: "Account", source: "metadata", show: ["feed", "breakdown"] },
      ],
    };
    const app = createConfigTestApp(customConfig);

    const res = await app.request("/api/config");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.name).toBe("My SaaS");
    expect(body.dimensions).toHaveLength(2);
    expect(body.dimensions[0].key).toBe("userId");
    expect(body.dimensions[1].key).toBe("account_id");
  });

  it("returns default config when none provided", async () => {
    const app = createConfigTestApp();

    const res = await app.request("/api/config");
    const body = await res.json();

    expect(body.name).toBe("langfuse-board");
    expect(body.dimensions.length).toBeGreaterThan(0);
  });
});

describe("GET /api/config/diagnostic", () => {
  it("returns detected fields with coverage", async () => {
    const config: BoardConfig = {
      name: "Test",
      dimensions: [
        { key: "account_id", label: "Account", source: "metadata", show: ["feed"] },
      ],
    };
    const app = createConfigTestApp(config);

    const res = await app.request("/api/config/diagnostic");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.tracesScanned).toBe(3);
    expect(body.fields.length).toBeGreaterThan(0);

    const accountField = body.fields.find((f: { key: string }) => f.key === "account_id");
    expect(accountField).toBeDefined();
    expect(accountField.source).toBe("metadata");
    expect(accountField.coverage).toBeCloseTo(66.7, 0);
    expect(accountField.configured).toBe(true);
    expect(accountField.configuredLabel).toBe("Account");

    const planField = body.fields.find((f: { key: string }) => f.key === "plan");
    expect(planField).toBeDefined();
    expect(planField.configured).toBe(false);
  });
});
