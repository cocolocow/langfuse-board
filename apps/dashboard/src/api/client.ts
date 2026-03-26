const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class RateLimitError extends Error {
  constructor() {
    super("rate_limit");
    this.name = "RateLimitError";
  }
}

export async function fetchApi<T>(path: string, query: string): Promise<T> {
  const separator = query ? "?" : "";
  const res = await fetch(`${API_BASE}${path}${separator}${query}`);

  if (!res.ok) {
    if (res.status === 429) {
      throw new RateLimitError();
    }
    await res.text();
    throw new Error(`Something went wrong (${res.status})`);
  }

  return res.json() as Promise<T>;
}
