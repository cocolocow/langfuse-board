import type {
  LangfuseMetricsQuery,
  LangfuseMetricsResponse,
} from "@langfuse-board/shared";
import type { ILangfuseClient, LangfuseTrace } from "./client.js";

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateDailyData(
  from: string,
  to: string,
  baseValue: number,
  variance: number,
): { time_dimension: string; value: number }[] {
  const start = new Date(from);
  const end = new Date(to);
  const days: { time_dimension: string; value: number }[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      time_dimension: d.toISOString().split("T")[0]!,
      value: randomBetween(baseValue - variance, baseValue + variance),
    });
  }
  return days;
}

function handleQuery(query: LangfuseMetricsQuery): LangfuseMetricsResponse {
  const dims = query.dimensions?.map((d) => d.field) ?? [];
  const metrics = query.metrics.map((m) => `${m.aggregation}_${m.measure}`);
  const hasTime = !!query.timeDimension;

  // Cost total
  if (query.view === "traces" && metrics.includes("sum_totalCost") && metrics.includes("count_count") && !hasTime && dims.length === 0) {
    return {
      data: [{ sum_totalCost: 2847.32, count: 18420, sum_totalTokens: 45200000 }],
    };
  }

  // Cost trend
  if (query.view === "traces" && metrics.includes("sum_totalCost") && hasTime && dims.length === 0) {
    const days = generateDailyData(query.fromTimestamp, query.toTimestamp, 95, 35);
    return { data: days.map((d) => ({ time: d.time_dimension, sum_totalCost: d.value })) };
  }

  // Traces trend
  if (query.view === "traces" && metrics.includes("count_count") && hasTime && dims.length === 0) {
    const days = generateDailyData(query.fromTimestamp, query.toTimestamp, 600, 200);
    return { data: days.map((d) => ({ time: d.time_dimension, count: Math.round(d.value) })) };
  }

  // Tokens trend
  if (query.view === "traces" && metrics.includes("sum_totalTokens") && hasTime) {
    const days = generateDailyData(query.fromTimestamp, query.toTimestamp, 1500000, 500000);
    return { data: days.map((d) => ({ time: d.time_dimension, sum_totalTokens: Math.round(d.value) })) };
  }

  // Latency (non-trend)
  if (query.view === "traces" && metrics.includes("avg_latency") && !hasTime) {
    return {
      data: [{ avg_latency: 1340, p95_latency: 4200 }],
    };
  }

  // Latency trend
  if (query.view === "traces" && metrics.includes("avg_latency") && hasTime) {
    const days = generateDailyData(query.fromTimestamp, query.toTimestamp, 1300, 400);
    return {
      data: days.map((d) => ({
        time: d.time_dimension,
        avg_latency: d.value,
        p95_latency: d.value * 2.8,
      })),
    };
  }

  // Cost by model
  if (query.view === "observations" && dims.includes("providedModelName") && metrics.includes("sum_totalCost")) {
    return {
      data: [
        { providedModelName: "claude-sonnet-4-20250514", sum_totalCost: 1250.40, sum_totalTokens: 18500000, count: 8200 },
        { providedModelName: "gpt-4o", sum_totalCost: 890.20, sum_totalTokens: 12300000, count: 5100 },
        { providedModelName: "gpt-4o-mini", sum_totalCost: 420.15, sum_totalTokens: 28400000, count: 12500 },
        { providedModelName: "claude-haiku-4-5-20251001", sum_totalCost: 186.57, sum_totalTokens: 32100000, count: 15200 },
        { providedModelName: "gemini-2.0-flash", sum_totalCost: 100.00, sum_totalTokens: 8900000, count: 3400 },
      ],
    };
  }

  // Cost by trace name
  if (query.view === "traces" && dims.includes("name") && metrics.includes("sum_totalCost")) {
    return {
      data: [
        { name: "chat-completion", sum_totalCost: 1420.50, sum_totalTokens: 28000000 },
        { name: "document-qa", sum_totalCost: 680.30, sum_totalTokens: 12000000 },
        { name: "summarize", sum_totalCost: 410.20, sum_totalTokens: 8500000 },
        { name: "code-review", sum_totalCost: 220.15, sum_totalTokens: 5200000 },
        { name: "translate", sum_totalCost: 116.17, sum_totalTokens: 3100000 },
      ],
    };
  }

  // Usage by user
  if (query.view === "traces" && dims.includes("userId")) {
    return {
      data: [
        { userId: "alice@company.com", count: 3200, sum_totalCost: 680.40 },
        { userId: "bob@company.com", count: 2800, sum_totalCost: 520.30 },
        { userId: "charlie@company.com", count: 1950, sum_totalCost: 410.15 },
        { userId: "diana@company.com", count: 1600, sum_totalCost: 340.20 },
        { userId: "eve@company.com", count: 1200, sum_totalCost: 280.10 },
        { userId: "frank@company.com", count: 980, sum_totalCost: 195.50 },
        { userId: "grace@company.com", count: 750, sum_totalCost: 160.30 },
        { userId: "henry@company.com", count: 520, sum_totalCost: 130.20 },
      ],
    };
  }

  // Scores
  if (query.view === "scores-numeric") {
    return {
      data: [
        { name: "helpfulness", avg_value: 0.87, count: 4200 },
        { name: "accuracy", avg_value: 0.92, count: 3800 },
        { name: "relevance", avg_value: 0.84, count: 4100 },
      ],
    };
  }

  return { data: [] };
}

export function createMockLangfuseClient(): ILangfuseClient {
  return {
    queryMetrics: async (query: LangfuseMetricsQuery) => {
      await new Promise((r) => setTimeout(r, randomBetween(50, 200)));
      return handleQuery(query);
    },
    getDailyMetrics: async (params: { from?: string; to?: string } = {}) => {
      await new Promise((r) => setTimeout(r, randomBetween(30, 100)));
      return { data: generateMockDailyMetrics(params.from, params.to) };
    },
    listTraces: async (limit = 30) => {
      await new Promise((r) => setTimeout(r, randomBetween(20, 80)));
      return { data: generateMockTraces(limit) };
    },
    healthCheck: async () => true,
  } as ILangfuseClient;
}

function generateMockDailyMetrics(from?: string, to?: string) {
  const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const end = to ? new Date(to) : new Date();
  const rows = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    rows.push({
      date: d.toISOString().split("T")[0]!,
      countTraces: Math.round(randomBetween(400, 800)),
      countObservations: Math.round(randomBetween(800, 1600)),
      totalCost: randomBetween(60, 130),
      usage: [
        {
          model: "claude-sonnet-4-20250514",
          inputUsage: Math.round(randomBetween(300000, 600000)),
          outputUsage: Math.round(randomBetween(80000, 200000)),
          totalUsage: Math.round(randomBetween(400000, 800000)),
          countTraces: Math.round(randomBetween(150, 300)),
          countObservations: Math.round(randomBetween(200, 400)),
          totalCost: randomBetween(25, 55),
        },
        {
          model: "gpt-4o",
          inputUsage: Math.round(randomBetween(200000, 400000)),
          outputUsage: Math.round(randomBetween(50000, 150000)),
          totalUsage: Math.round(randomBetween(250000, 550000)),
          countTraces: Math.round(randomBetween(100, 200)),
          countObservations: Math.round(randomBetween(150, 300)),
          totalCost: randomBetween(18, 40),
        },
        {
          model: "gpt-4o-mini",
          inputUsage: Math.round(randomBetween(500000, 1000000)),
          outputUsage: Math.round(randomBetween(150000, 400000)),
          totalUsage: Math.round(randomBetween(650000, 1400000)),
          countTraces: Math.round(randomBetween(200, 400)),
          countObservations: Math.round(randomBetween(300, 600)),
          totalCost: randomBetween(8, 20),
        },
        {
          model: "claude-haiku-4-5-20251001",
          inputUsage: Math.round(randomBetween(600000, 1200000)),
          outputUsage: Math.round(randomBetween(200000, 500000)),
          totalUsage: Math.round(randomBetween(800000, 1700000)),
          countTraces: Math.round(randomBetween(250, 500)),
          countObservations: Math.round(randomBetween(350, 700)),
          totalCost: randomBetween(5, 15),
        },
      ],
    });
  }
  return rows;
}

const MOCK_FEATURES = [
  "chat-completion",
  "document-qa",
  "summarize",
  "code-review",
  "translate",
  "search",
  "classify",
];

const MOCK_MODELS = [
  "claude-sonnet-4-20250514",
  "gpt-4o",
  "gpt-4o-mini",
  "claude-haiku-4-5-20251001",
  "gemini-2.0-flash",
];

const MOCK_USERS = [
  "alice@company.com",
  "bob@company.com",
  "charlie@company.com",
  "diana@company.com",
  "eve@company.com",
  "frank@company.com",
];

const MOCK_ACCOUNTS = [
  { id: "acme-corp", name: "Acme Corp", plan: "enterprise" },
  { id: "beta-inc", name: "Beta Inc", plan: "pro" },
  { id: "gamma-io", name: "Gamma.io", plan: "pro" },
  { id: "delta-labs", name: "Delta Labs", plan: "starter" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

let traceCounter = 0;

function generateMockTraces(count: number): LangfuseTrace[] {
  const traces: LangfuseTrace[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    traceCounter++;
    const ageMs = i * randomBetween(3000, 15000);
    const isError = Math.random() < 0.05;
    const model = pick(MOCK_MODELS);
    const latency = randomBetween(0.3, 8);
    const cost =
      model.includes("gpt-4o-mini") || model.includes("haiku") || model.includes("flash")
        ? randomBetween(0.001, 0.02)
        : randomBetween(0.01, 0.15);

    const userId = Math.random() < 0.9 ? pick(MOCK_USERS) : null;
    const account = pick(MOCK_ACCOUNTS);
    const userName = userId ? userId.split("@")[0]! : null;

    traces.push({
      id: `trace-${traceCounter}`,
      timestamp: new Date(now - ageMs).toISOString(),
      name: pick(MOCK_FEATURES),
      userId,
      sessionId: null,
      latency,
      totalCost: cost,
      metadata: {
        account_id: account.id,
        account_name: account.name,
        user_name: userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : null,
        plan: account.plan,
        model,
      },
      observations: [
        {
          model,
          level: isError ? "ERROR" : "DEFAULT",
        },
      ],
    });
  }

  return traces;
}
