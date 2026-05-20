import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.js";
import { NoDataYetError, RateLimitError } from "./api/client.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache is owned by the backend, not React Query. The frontend always
      // re-asks the backend on mount; the backend serves cached-or-204.
      staleTime: 0,
      // No retries on the two "expected" errors — we render an empty/wait state.
      retry: (failureCount, error) => {
        if (error instanceof NoDataYetError) return false;
        if (error instanceof RateLimitError) return false;
        return failureCount < 1;
      },
      // The user controls refreshes via the Refresh button. No auto-fetch.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
