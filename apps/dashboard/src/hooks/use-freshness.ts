import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onResponseMeta } from "../api/client.js";

export interface FreshnessState {
  /** Epoch ms when the backend last fetched the OLDEST data on screen. */
  cachedAt: number | null;
  /** Sticky — any of the active queries on screen is serving stale data. */
  stale: boolean;
  /** Epoch ms when Langfuse will accept fresh requests again. Anchored at the
   * time we received the retry-after header so the countdown stays stable
   * across re-renders. Null if no rate-limit signal received. */
  retryAt: number | null;
}

/**
 * Tracks the OLDEST `cachedAt` across all responses received so far, plus
 * whether any of them came from the stale fallback, and the LATEST retry-at
 * timestamp from Langfuse's rate-limit signal. Powers the header's "Last
 * refreshed N min ago · [Refresh / Available in Xh Ymin]" indicator.
 */
export function useFreshness() {
  const [meta, setMeta] = useState<FreshnessState | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onResponseMeta((next) => {
      const nextRetryAt =
        next.retryAfterSeconds != null
          ? Date.now() + next.retryAfterSeconds * 1000
          : null;
      setMeta((prev) => {
        if (!prev) {
          return {
            cachedAt: next.cachedAt,
            stale: next.stale,
            retryAt: nextRetryAt,
          };
        }
        const prevAt = prev.cachedAt ?? Infinity;
        const nextAt = next.cachedAt ?? Infinity;
        const retryAt = Math.max(prev.retryAt ?? 0, nextRetryAt ?? 0) || null;
        return {
          cachedAt: Math.min(prevAt, nextAt) === Infinity ? null : Math.min(prevAt, nextAt),
          stale: prev.stale || next.stale,
          retryAt,
        };
      });
    });
    return unsubscribe;
  }, []);

  // Reset the tracked freshness whenever the user manually refreshes so the
  // indicator immediately reflects the newer responses coming in.
  const refresh = async () => {
    setMeta(null);
    // Flip a global "force" flag for the next round of fetches. React Query's
    // refetchQueries will re-call queryFn which reads the flag.
    setForceFlag(true);
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      // Drop the flag after the in-flight fetches captured it.
      setTimeout(() => setForceFlag(false), 0);
    }
  };

  return { meta, refresh };
}

/* ----- module-level force flag, read by query functions ----- */
let _forceFlag = false;
const _flagListeners = new Set<(v: boolean) => void>();

function setForceFlag(v: boolean): void {
  _forceFlag = v;
  _flagListeners.forEach((l) => l(v));
}

/** Read by hooks/use-dashboard-data so the next fetch attaches ?force=true. */
export function shouldForce(): boolean {
  return _forceFlag;
}
