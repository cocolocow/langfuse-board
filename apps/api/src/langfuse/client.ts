import type {
  LangfuseMetricsQuery,
  LangfuseMetricsResponse,
} from "@langfuse-board/shared";

export interface LangfuseClientConfig {
  host: string;
  publicKey: string;
  secretKey: string;
}

export class LangfuseClient {
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
