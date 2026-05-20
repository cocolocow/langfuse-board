import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Tracks calls actually hitting Langfuse (cache misses that returned 200) over
 * a rolling 24h window. Used by the dashboard to display "X/100 appels utilisés"
 * so Coco knows when he's about to burn the quota — Langfuse doesn't expose a
 * RateLimit-Remaining header on success responses, so we estimate locally.
 *
 * Persists timestamps to disk so the counter survives board restarts.
 */
export class QuotaTracker {
  private timestamps: number[] = [];
  private persistTo: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: { persistTo?: string } = {}) {
    if (options.persistTo) {
      this.persistTo = resolve(options.persistTo);
      this.hydrateFromDisk();
    }
  }

  /** Called by the Langfuse client right after a successful fetch. */
  record(): void {
    this.timestamps.push(Date.now());
    this.scheduleFlush();
  }

  /** Number of calls made in the trailing 24 hours. */
  getUsageLast24h(): number {
    this.prune();
    return this.timestamps.length;
  }

  /** Epoch ms when the oldest call inside the rolling window happened. Returns
   * null if we have no recent calls. Useful for an ETA on quota recovery. */
  getOldestCallInWindow(): number | null {
    this.prune();
    return this.timestamps[0] ?? null;
  }

  /** Drop timestamps older than 24h from now. */
  private prune(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    while (this.timestamps.length > 0 && this.timestamps[0]! < cutoff) {
      this.timestamps.shift();
    }
  }

  private hydrateFromDisk(): void {
    if (!this.persistTo) return;
    try {
      const raw = readFileSync(this.persistTo, "utf-8");
      const parsed = JSON.parse(raw) as number[];
      if (Array.isArray(parsed)) {
        this.timestamps = parsed.filter((t) => typeof t === "number");
        this.prune();
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        console.warn(`[quota-tracker] failed to hydrate from ${this.persistTo}:`, err);
      }
    }
  }

  private scheduleFlush(): void {
    if (!this.persistTo) return;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushToDisk();
    }, 500);
  }

  private flushToDisk(): void {
    if (!this.persistTo) return;
    try {
      this.prune();
      mkdirSync(dirname(this.persistTo), { recursive: true });
      writeFileSync(this.persistTo, JSON.stringify(this.timestamps), "utf-8");
    } catch (err) {
      console.warn(`[quota-tracker] failed to persist to ${this.persistTo}:`, err);
    }
  }

  reset(): void {
    this.timestamps = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushToDisk();
  }
}

/* Module-level singleton — set up at boot in index.ts so the LangfuseClient
 * can record() without having to thread the tracker through every call site. */
let _instance: QuotaTracker | null = null;

export function setQuotaTracker(tracker: QuotaTracker): void {
  _instance = tracker;
}

export function recordLangfuseCall(): void {
  _instance?.record();
}

export function getQuotaTracker(): QuotaTracker | null {
  return _instance;
}
