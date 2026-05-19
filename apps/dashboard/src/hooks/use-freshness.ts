import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onResponseMeta, type ResponseMeta } from "../api/client.js";

/**
 * Tracks the OLDEST `cachedAt` across all responses received so far, plus
 * whether any of them came from the stale fallback. Powers the "Last
 * refreshed N min ago · Refresh" indicator in the header.
 *
 * We pick the oldest deliberately: the user wants to know how out-of-date
 * the worst piece of data on screen is, not the best.
 */
export function useFreshness() {
  const [meta, setMeta] = useState<ResponseMeta | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onResponseMeta((next) => {
      setMeta((prev) => {
        if (!prev) return next;
        // Keep the OLDEST cachedAt + sticky stale flag for the current page
        const prevAt = prev.cachedAt ?? Infinity;
        const nextAt = next.cachedAt ?? Infinity;
        return {
          cachedAt: Math.min(prevAt, nextAt) === Infinity ? null : Math.min(prevAt, nextAt),
          stale: prev.stale || next.stale,
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
