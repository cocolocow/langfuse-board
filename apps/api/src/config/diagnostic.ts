import type { LangfuseTrace } from "../langfuse/client.js";
import type { BoardConfig, DiagnosticField, DiagnosticResponse } from "@langfuse-board/shared";

const TRACE_FIELDS = ["userId", "name", "sessionId"] as const;

export function extractDiagnosticFields(
  traces: LangfuseTrace[],
  config: BoardConfig,
): DiagnosticResponse {
  if (traces.length === 0) {
    return { fields: [], tracesScanned: 0 };
  }

  const total = traces.length;
  const fieldCounts = new Map<string, { count: number; source: "trace" | "metadata" }>();

  for (const trace of traces) {
    for (const field of TRACE_FIELDS) {
      const value = trace[field];
      if (value !== null && value !== undefined) {
        const entry = fieldCounts.get(field) ?? { count: 0, source: "trace" };
        entry.count++;
        fieldCounts.set(field, entry);
      }
    }

    if (trace.metadata && typeof trace.metadata === "object") {
      for (const key of Object.keys(trace.metadata)) {
        const value = trace.metadata[key];
        if (value !== null && value !== undefined) {
          const entry = fieldCounts.get(key) ?? { count: 0, source: "metadata" };
          entry.count++;
          fieldCounts.set(key, entry);
        }
      }
    }
  }

  const configuredKeys = new Map(config.dimensions.map((d) => [d.key, d.label]));

  const fields: DiagnosticField[] = Array.from(fieldCounts.entries())
    .map(([key, { count, source }]) => ({
      key,
      source,
      coverage: Math.round((count / total) * 1000) / 10,
      configured: configuredKeys.has(key),
      configuredLabel: configuredKeys.get(key) ?? null,
    }))
    .sort((a, b) => b.coverage - a.coverage);

  return { fields, tracesScanned: total };
}
