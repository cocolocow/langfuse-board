import type {
  LangfuseMetricsQuery,
  LangfuseMetricsResponse,
} from "@langfuse-board/shared";

export interface LangfuseTrace {
  id: string;
  timestamp: string;
  name: string | null;
  userId: string | null;
  sessionId: string | null;
  latency: number | null;
  totalCost: number;
  metadata: Record<string, unknown> | null;
  observations: (string | { model: string | null; level: string })[];
}

export interface LangfuseTracesResponse {
  data: LangfuseTrace[];
}

export interface LangfuseDailyUsage {
  model: string;
  inputUsage: number;
  outputUsage: number;
  totalUsage: number;
  countTraces: number;
  countObservations: number;
  totalCost: number;
}

export interface LangfuseDailyRow {
  date: string;
  countTraces: number;
  countObservations: number;
  totalCost: number;
  usage: LangfuseDailyUsage[];
}

export interface LangfuseDailyResponse {
  data: LangfuseDailyRow[];
}

export interface ILangfuseClient {
  queryMetrics(query: LangfuseMetricsQuery): Promise<LangfuseMetricsResponse>;
  getDailyMetrics(params?: { from?: string; to?: string; traceName?: string }): Promise<LangfuseDailyResponse>;
  listTraces(limit?: number): Promise<LangfuseTracesResponse>;
  healthCheck(): Promise<boolean>;
}

export interface LangfuseClientConfig {
  host: string;
  publicKey: string;
  secretKey: string;
}

export class LangfuseClient implements ILangfuseClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: LangfuseClientConfig) {
    this.baseUrl = config.host.replace(/\/$/, "");
    this.authHeader = `Basic ${btoa(`${config.publicKey}:${config.secretKey}`)}`;
  }

  async queryMetrics(
    query: LangfuseMetricsQuery,
  ): Promise<LangfuseMetricsResponse> {
    const encodedQuery = encodeURIComponent(JSON.stringify(query));
    const url = `${this.baseUrl}/api/public/metrics?query=${encodedQuery}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limited by Langfuse API");
      }
      const body = await response.text();
      throw new Error(
        `Langfuse API error ${response.status}: ${body}`,
      );
    }

    return response.json() as Promise<LangfuseMetricsResponse>;
  }

  async getDailyMetrics(params: {
    from?: string;
    to?: string;
    traceName?: string;
  } = {}): Promise<LangfuseDailyResponse> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set("fromTimestamp", params.from);
    if (params.to) searchParams.set("toTimestamp", params.to);
    if (params.traceName) searchParams.set("traceName", params.traceName);

    const url = `${this.baseUrl}/api/public/metrics/daily?${searchParams}`;

    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limited by Langfuse API");
      }
      const body = await response.text();
      throw new Error(`Langfuse API error ${response.status}: ${body}`);
    }

    return response.json() as Promise<LangfuseDailyResponse>;
  }

  async listTraces(limit = 30): Promise<LangfuseTracesResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      orderBy: "timestamp.desc",
    });
    const url = `${this.baseUrl}/api/public/traces?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limited by Langfuse API");
      }
      const body = await response.text();
      throw new Error(`Langfuse API error ${response.status}: ${body}`);
    }

    return response.json() as Promise<LangfuseTracesResponse>;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/public/health`,
        {
          headers: { Authorization: this.authHeader },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
