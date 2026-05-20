import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api/client.js";
import { shouldForce } from "./use-freshness.js";
import { useDateRange } from "./use-date-range.js";
import type {
  OverviewResponse,
  CostsResponse,
  UsageResponse,
  QualityResponse,
  FeedResponse,
  FeaturesResponse,
  UsersDetailResponse,
  PersonasResponse,
  TimeseriesResponse,
  AnomaliesResponse,
  ForecastResponse,
} from "@langfuse-board/shared";

export function useOverview() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["overview", queryString],
    queryFn: () => fetchApi<OverviewResponse>("/api/overview", queryString, { force: shouldForce() }),
  });
}

export function useCosts() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["costs", queryString],
    queryFn: () => fetchApi<CostsResponse>("/api/costs", queryString, { force: shouldForce() }),
  });
}

export function useUsage() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["usage", queryString],
    queryFn: () => fetchApi<UsageResponse>("/api/usage", queryString, { force: shouldForce() }),
  });
}

export function useQuality() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["quality", queryString],
    queryFn: () => fetchApi<QualityResponse>("/api/quality", queryString, { force: shouldForce() }),
  });
}

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchApi<FeedResponse>("/api/feed", "limit=30", { force: shouldForce() }),
    // No auto-refetch — Coco controls reload via the header's Refresh button so
    // the Langfuse free-tier quota isn't burned by polling.
  });
}

interface BreakdownResponse {
  dimension: { key: string; label: string };
  items: { name: string; cost: number; count: number; percentage: number }[];
}

export function useBreakdown(key: string) {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["breakdown", key, queryString],
    queryFn: () => fetchApi<BreakdownResponse>("/api/breakdown", `key=${key}&${queryString}`, { force: shouldForce() }),
    enabled: !!key,
  });
}

export function useFeatures() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["features", queryString],
    queryFn: () => fetchApi<FeaturesResponse>("/api/features", queryString, { force: shouldForce() }),
  });
}

export function useUsersDetail() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["users-detail", queryString],
    queryFn: () => fetchApi<UsersDetailResponse>("/api/users-detail", queryString, { force: shouldForce() }),
  });
}

export function usePersonas() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["personas", queryString],
    queryFn: () => fetchApi<PersonasResponse>("/api/personas", queryString, { force: shouldForce() }),
  });
}

export function useTimeseries(
  metric: "cost" | "tokens" | "traces" = "cost",
  groupBy: "model" | "user" | "feature" | "persona" | "none" = "none",
) {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["timeseries", metric, groupBy, queryString],
    queryFn: () =>
      fetchApi<TimeseriesResponse>(
        "/api/timeseries",
        `metric=${metric}&groupBy=${groupBy}&${queryString}`,
        { force: shouldForce() },
      ),
  });
}

export function useAnomalies(lookbackDays = 14, zThreshold = 2) {
  return useQuery({
    queryKey: ["anomalies", lookbackDays, zThreshold],
    queryFn: () =>
      fetchApi<AnomaliesResponse>(
        "/api/anomalies",
        `lookbackDays=${lookbackDays}&zThreshold=${zThreshold}`,
        { force: shouldForce() },
      ),
  });
}

export function useForecast(days = 30) {
  return useQuery({
    queryKey: ["forecast", days],
    queryFn: () =>
      fetchApi<ForecastResponse>("/api/forecast", `days=${days}`, { force: shouldForce() }),
  });
}
