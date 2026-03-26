const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchApi<T>(path: string, query: string): Promise<T> {
  const separator = query ? "?" : "";
  const res = await fetch(`${API_BASE}${path}${separator}${query}`);

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
