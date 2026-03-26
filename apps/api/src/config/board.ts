import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BoardConfig } from "@langfuse-board/shared";

export const boardConfigSchema = z.object({
  name: z.string().min(1),
  dimensions: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      source: z.enum(["trace", "metadata"]),
      show: z.array(z.enum(["feed", "breakdown", "filter"])).min(1),
    }),
  ),
});

export const DEFAULT_CONFIG: BoardConfig = {
  name: "langfuse-board",
  dimensions: [
    { key: "userId", label: "User", source: "trace", show: ["feed", "breakdown"] },
    { key: "providedModelName", label: "Model", source: "trace", show: ["feed", "breakdown"] },
  ],
};

export function parseBoardConfig(jsonString: string): BoardConfig {
  try {
    const parsed = JSON.parse(jsonString);
    const result = boardConfigSchema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn("[config] Invalid board.config.json, using defaults:", result.error.issues);
    return DEFAULT_CONFIG;
  } catch {
    console.warn("[config] Failed to parse board.config.json, using defaults");
    return DEFAULT_CONFIG;
  }
}

export function loadBoardConfig(rootDir: string): BoardConfig {
  const configPath = resolve(rootDir, "board.config.json");
  try {
    const content = readFileSync(configPath, "utf-8");
    console.log(`[config] Loaded board.config.json from ${configPath}`);
    return parseBoardConfig(content);
  } catch {
    console.log("[config] No board.config.json found, using defaults");
    return DEFAULT_CONFIG;
  }
}
