import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const envFile = readFileSync(resolve(__dirname, "../../.env"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  } catch {
    // .env not found — tests will be skipped via runIf
  }
}

loadEnv();

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/live/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
