import { AlertCircle, Clock } from "lucide-react";
import { RateLimitError } from "../api/client.js";

function formatRetryDuration(seconds: number): string {
  if (seconds <= 0) return "à l'instant";
  if (seconds < 60) return `dans ${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `dans ${min} min`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `dans ${hours}h ${remMin}min` : `dans ${hours}h`;
}

export function Loader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card h-[106px] p-5">
            <div className="h-2.5 w-16 rounded bg-surface-elevated" />
            <div className="mt-4 h-6 w-24 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card h-[290px] p-5">
            <div className="h-2.5 w-20 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, error }: { message?: string; error?: Error | null }) {
  const msg = message ?? error?.message ?? "";
  const isRateLimit = error instanceof RateLimitError || msg.includes("429") || msg.toLowerCase().includes("rate limit");

  if (isRateLimit) {
    const retryAfter =
      error instanceof RateLimitError ? error.retryAfterSeconds : null;
    const countdown = retryAfter != null ? formatRetryDuration(retryAfter) : null;
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground">
            Quota Langfuse épuisé
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] text-muted">
            Le free tier de Langfuse Cloud limite à 100 appels API par jour.
            {countdown ? (
              <>
                {" "}Données disponibles <strong className="text-foreground">{countdown}</strong>.
              </>
            ) : (
              " Réessaie dans quelques heures."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-negative-dim">
        <AlertCircle className="h-6 w-6 text-negative" />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-medium text-foreground">Something went wrong</p>
        {message && (
          <p className="mt-1.5 text-[13px] text-muted">{message}</p>
        )}
      </div>
    </div>
  );
}
