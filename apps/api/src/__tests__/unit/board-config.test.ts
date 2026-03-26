import { describe, it, expect } from "vitest";
import {
  boardConfigSchema,
  DEFAULT_CONFIG,
  parseBoardConfig,
} from "../../config/board.js";

describe("boardConfigSchema", () => {
  it("validates a correct config", () => {
    const result = boardConfigSchema.safeParse({
      name: "My SaaS",
      dimensions: [
        { key: "userId", label: "User", source: "trace", show: ["feed", "breakdown"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = boardConfigSchema.safeParse({
      dimensions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = boardConfigSchema.safeParse({
      name: "Test",
      dimensions: [
        { key: "x", label: "X", source: "database", show: ["feed"] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid show value", () => {
    const result = boardConfigSchema.safeParse({
      name: "Test",
      dimensions: [
        { key: "x", label: "X", source: "trace", show: ["table"] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty dimensions", () => {
    const result = boardConfigSchema.safeParse({
      name: "Test",
      dimensions: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple dimensions", () => {
    const result = boardConfigSchema.safeParse({
      name: "Test",
      dimensions: [
        { key: "userId", label: "User", source: "trace", show: ["feed"] },
        { key: "account_id", label: "Account", source: "metadata", show: ["feed", "breakdown"] },
        { key: "plan", label: "Plan", source: "metadata", show: ["filter"] },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions).toHaveLength(3);
    }
  });
});

describe("DEFAULT_CONFIG", () => {
  it("has a name", () => {
    expect(DEFAULT_CONFIG.name).toBe("langfuse-board");
  });

  it("has userId and model dimensions", () => {
    expect(DEFAULT_CONFIG.dimensions.find((d) => d.key === "userId")).toBeDefined();
    expect(DEFAULT_CONFIG.dimensions.find((d) => d.key === "providedModelName")).toBeDefined();
  });

  it("userId shows in feed and breakdown", () => {
    const dim = DEFAULT_CONFIG.dimensions.find((d) => d.key === "userId")!;
    expect(dim.show).toContain("feed");
    expect(dim.show).toContain("breakdown");
  });
});

describe("parseBoardConfig", () => {
  it("parses valid JSON", () => {
    const json = JSON.stringify({
      name: "Test",
      dimensions: [{ key: "a", label: "A", source: "trace", show: ["feed"] }],
    });
    const config = parseBoardConfig(json);
    expect(config.name).toBe("Test");
    expect(config.dimensions).toHaveLength(1);
  });

  it("returns default config for invalid JSON", () => {
    const config = parseBoardConfig("not json{{{");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("returns default config for invalid schema", () => {
    const config = parseBoardConfig(JSON.stringify({ bad: true }));
    expect(config).toEqual(DEFAULT_CONFIG);
  });
});
