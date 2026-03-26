import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api/client.js";
import type { BoardConfig, DiagnosticResponse } from "@langfuse-board/shared";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => fetchApi<BoardConfig>("/api/config", ""),
    staleTime: Infinity,
  });
}

export function useDiagnostic() {
  return useQuery({
    queryKey: ["diagnostic"],
    queryFn: () => fetchApi<DiagnosticResponse>("/api/config/diagnostic", ""),
    staleTime: 60_000,
  });
}
