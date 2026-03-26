import { describe, it, expect } from "vitest";
import { extractDiagnosticFields } from "../../config/diagnostic.js";
import type { LangfuseTrace } from "../../langfuse/client.js";
import type { BoardConfig } from "@langfuse-board/shared";

const config: BoardConfig = {
  name: "Test",
  dimensions: [
    { key: "userId", label: "User", source: "trace", show: ["feed"] },
    { key: "account_id", label: "Account", source: "metadata", show: ["feed", "breakdown"] },
  ],
};

function makeTrace(overrides: Partial<LangfuseTrace> = {}): LangfuseTrace {
  return {
    id: "t-1",
    timestamp: "2024-01-01T00:00:00Z",
    name: "test",
    userId: "user-1",
    latency: 1,
    totalCost: 0.01,
    metadata: null,
    observations: [],
    ...overrides,
  };
}

describe("extractDiagnosticFields", () => {
  it("detects built-in trace fields", () => {
    const traces = [makeTrace({ userId: "alice" }), makeTrace({ userId: "bob" })];
    const result = extractDiagnosticFields(traces, config);

    const userIdField = result.fields.find((f) => f.key === "userId");
    expect(userIdField).toBeDefined();
    expect(userIdField!.source).toBe("trace");
    expect(userIdField!.coverage).toBe(100);
    expect(userIdField!.configured).toBe(true);
    expect(userIdField!.configuredLabel).toBe("User");
  });

  it("detects metadata fields with coverage", () => {
    const traces = [
      makeTrace({ metadata: { account_id: "acme", plan: "pro" } }),
      makeTrace({ metadata: { account_id: "beta" } }),
      makeTrace({ metadata: null }),
    ];
    const result = extractDiagnosticFields(traces, config);

    const accountField = result.fields.find((f) => f.key === "account_id");
    expect(accountField).toBeDefined();
    expect(accountField!.source).toBe("metadata");
    expect(accountField!.coverage).toBeCloseTo(66.7, 0);
    expect(accountField!.configured).toBe(true);

    const planField = result.fields.find((f) => f.key === "plan");
    expect(planField).toBeDefined();
    expect(planField!.coverage).toBeCloseTo(33.3, 0);
    expect(planField!.configured).toBe(false);
  });

  it("returns empty fields for empty traces", () => {
    const result = extractDiagnosticFields([], config);
    expect(result.fields).toEqual([]);
    expect(result.tracesScanned).toBe(0);
  });

  it("reports tracesScanned count", () => {
    const traces = [makeTrace(), makeTrace(), makeTrace()];
    const result = extractDiagnosticFields(traces, config);
    expect(result.tracesScanned).toBe(3);
  });

  it("sorts by coverage descending", () => {
    const traces = [
      makeTrace({ userId: "a", metadata: { rare: "x" } }),
      makeTrace({ userId: "b", metadata: { common: "y" } }),
      makeTrace({ userId: "c", metadata: { common: "z" } }),
    ];
    const result = extractDiagnosticFields(traces, config);

    const metaFields = result.fields.filter((f) => f.source === "metadata");
    expect(metaFields[0]!.key).toBe("common");
    expect(metaFields[1]!.key).toBe("rare");
  });
});
