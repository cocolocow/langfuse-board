const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class RateLimitError extends Error {
  retryAfterSeconds: number | null;
  constructor(retryAfterSeconds: number | null = null) {
    super("rate_limit");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Per-response metadata captured from API headers. Exposed via the singleton
 * `lastResponseMeta` so a header bar can show "last refreshed N min ago". */
export interface ResponseMeta {
  /** Epoch ms when the backend last fetched this from Langfuse, or null if unknown. */
  cachedAt: number | null;
  /** True if the backend returned the previous (expired) value because Langfuse 429'd. */
  stale: boolean;
  /** Seconds until Langfuse will accept fresh requests, parsed from its retry-after
   * header. Lets the dashboard render a precise countdown next to the Refresh button. */
  retryAfterSeconds: number | null;
}

type MetaListener = (meta: ResponseMeta, path: string) => void;
const _listeners = new Set<MetaListener>();

export function onResponseMeta(listener: MetaListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export async function fetchApi<T>(
  path: string,
  query: string,
  options: { force?: boolean } = {},
): Promise<T> {
  const params = new URLSearchParams(query);
  if (options.force) params.set("force", "true");
  const finalQuery = params.toString();
  const separator = finalQuery ? "?" : "";
  const res = await fetch(`${API_BASE}${path}${separator}${finalQuery}`);

  const retryAfterHeader = res.headers.get("X-Retry-After-Seconds");
  const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

  if (!res.ok) {
    if (res.status === 429) {
      throw new RateLimitError(Number.isFinite(retryAfterSeconds!) ? retryAfterSeconds : null);
    }
    await res.text();
    throw new Error(`Something went wrong (${res.status})`);
  }

  const cachedAtHeader = res.headers.get("X-Cached-At");
  const staleHeader = res.headers.get("X-Stale");
  const meta: ResponseMeta = {
    cachedAt: cachedAtHeader ? Date.parse(cachedAtHeader) : null,
    stale: staleHeader === "true",
    retryAfterSeconds: Number.isFinite(retryAfterSeconds!) ? retryAfterSeconds : null,
  };
  _listeners.forEach((l) => l(meta, path));

  return res.json() as Promise<T>;
}
