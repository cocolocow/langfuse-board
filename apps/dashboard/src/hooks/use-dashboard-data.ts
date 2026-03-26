import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api/client.js";
import { useDateRange } from "./use-date-range.js";
import type {
  OverviewResponse,
  CostsResponse,
  UsageResponse,
  QualityResponse,
} from "@langfuse-board/shared";

export function useOverview() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["overview", queryString],
    queryFn: () => fetchApi<OverviewResponse>("/api/overview", queryString),
  });
}

export function useCosts() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["costs", queryString],
    queryFn: () => fetchApi<CostsResponse>("/api/costs", queryString),
  });
}

export function useUsage() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["usage", queryString],
    queryFn: () => fetchApi<UsageResponse>("/api/usage", queryString),
  });
}

export function useQuality() {
  const { queryString } = useDateRange();
  return useQuery({
    queryKey: ["quality", queryString],
    queryFn: () => fetchApi<QualityResponse>("/api/quality", queryString),
  });
}
