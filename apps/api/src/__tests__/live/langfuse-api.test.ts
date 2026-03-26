import { describe, it, expect, beforeAll } from "vitest";
import { LangfuseClient } from "../../langfuse/client.js";

const hasKeys = !!process.env["LANGFUSE_PUBLIC_KEY"] && !!process.env["LANGFUSE_SECRET_KEY"];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe.runIf(hasKeys)("Langfuse Live API", () => {
  let client: LangfuseClient;

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromISO = from.toISOString();
  const toISO = new Date().toISOString();

  beforeAll(() => {
    client = new LangfuseClient({
      host: process.env["LANGFUSE_HOST"] ?? "https://cloud.langfuse.com",
      publicKey: process.env["LANGFUSE_PUBLIC_KEY"]!,
      secretKey: process.env["LANGFUSE_SECRET_KEY"]!,
    });
  });

  // --- Health ---

  it("health check returns true", async () => {
    const ok = await client.healthCheck();
    expect(ok).toBe(true);
  });

  // --- Metrics API: field names ---

  it("metrics cost total returns sum_totalCost and count_count", async () => {
    await delay(1000);
    const res = await client.queryMetrics({
      view: "traces",
      metrics: [
        { measure: "totalCost", aggregation: "sum" },
        { measure: "count", aggregation: "count" },
      ],
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0) {
      const row = res.data[0]!;
      expect("sum_totalCost" in row).toBe(true);
      expect("count_count" in row).toBe(true);
    }
  });

  it("metrics with time dimension uses field name 'time_dimension'", async () => {
    await delay(1000);
    const res = await client.queryMetrics({
      view: "traces",
      metrics: [{ measure: "totalCost", aggregation: "sum" }],
      timeDimension: { granularity: "day" },
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data.length).toBeGreaterThan(0);
    const row = res.data[0]!;
    expect("time_dimension" in row).toBe(true);
    expect("time" in row).toBe(false);
    expect("date" in row).toBe(false);
  });

  it("metrics latency uses avg_latency and p95_latency", async () => {
    await delay(1000);
    const res = await client.queryMetrics({
      view: "traces",
      metrics: [
        { measure: "latency", aggregation: "avg" },
        { measure: "latency", aggregation: "p95" },
      ],
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data).toBeDefined();
    if (res.data.length > 0) {
      const row = res.data[0]!;
      expect("avg_latency" in row).toBe(true);
      expect("p95_latency" in row).toBe(true);
      expect("average_latency" in row).toBe(false);
    }
  });

  it("metrics by model uses providedModelName dimension", async () => {
    await delay(1000);
    const res = await client.queryMetrics({
      view: "observations",
      dimensions: [{ field: "providedModelName" }],
      metrics: [
        { measure: "totalCost", aggregation: "sum" },
        { measure: "totalTokens", aggregation: "sum" },
      ],
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data).toBeDefined();
    if (res.data.length > 0) {
      const row = res.data[0]!;
      expect("providedModelName" in row).toBe(true);
      expect("sum_totalCost" in row).toBe(true);
      expect("sum_totalTokens" in row).toBe(true);
    }
  });

  it("metrics by userId dimension works", async () => {
    await delay(2000);
    const res = await client.queryMetrics({
      view: "traces",
      dimensions: [{ field: "userId" }],
      metrics: [
        { measure: "count", aggregation: "count" },
        { measure: "totalCost", aggregation: "sum" },
      ],
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data).toBeDefined();
    if (res.data.length > 0) {
      const row = res.data[0]!;
      expect("userId" in row).toBe(true);
      expect("count_count" in row).toBe(true);
    }
  });

  it("scores-numeric returns avg_value and count_count", async () => {
    await delay(2000);
    const res = await client.queryMetrics({
      view: "scores-numeric",
      dimensions: [{ field: "name" }],
      metrics: [
        { measure: "value", aggregation: "avg" },
        { measure: "count", aggregation: "count" },
      ],
      fromTimestamp: fromISO,
      toTimestamp: toISO,
    });

    expect(res.data).toBeDefined();
    // Scores may be empty if none configured — that's OK
    if (res.data.length > 0) {
      const row = res.data[0]!;
      expect("avg_value" in row).toBe(true);
      expect("count_count" in row).toBe(true);
    }
  });

  // --- Traces API ---

  it("listTraces returns traces with expected fields", async () => {
    const res = await client.listTraces(5);

    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);

    if (res.data.length > 0) {
      const trace = res.data[0]!;
      expect("id" in trace).toBe(true);
      expect("timestamp" in trace).toBe(true);
      expect("name" in trace).toBe(true);
      expect("totalCost" in trace).toBe(true);
    }
  });

  it("traces have metadata field", async () => {
    const res = await client.listTraces(10);

    if (res.data.length > 0) {
      const trace = res.data[0]!;
      expect("metadata" in trace).toBe(true);
      // metadata can be null or an object
      if (trace.metadata !== null) {
        expect(typeof trace.metadata).toBe("object");
      }
    }
  });

  it("traces have observations array", async () => {
    const res = await client.listTraces(10);

    if (res.data.length > 0) {
      const trace = res.data[0]!;
      expect("observations" in trace).toBe(true);
      // observations in list endpoint may be IDs (strings) or objects
      // log the shape for debugging
      if (Array.isArray(trace.observations) && trace.observations.length > 0) {
        const obs = trace.observations[0]!;
        console.log("[live test] observation shape:", typeof obs, JSON.stringify(obs).slice(0, 200));
      }
    }
  });

  it("traces are ordered by timestamp desc", async () => {
    const res = await client.listTraces(20);

    if (res.data.length >= 2) {
      const first = new Date(res.data[0]!.timestamp).getTime();
      const second = new Date(res.data[1]!.timestamp).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });
});
