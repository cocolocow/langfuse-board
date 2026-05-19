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
