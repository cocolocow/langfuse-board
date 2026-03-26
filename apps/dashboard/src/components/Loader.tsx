import { AlertCircle, Clock } from "lucide-react";
import { RateLimitError } from "../api/client.js";

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
  const isRateLimit = error instanceof RateLimitError || message?.includes("429") || message?.includes("rate");

  if (isRateLimit) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground">Langfuse rate limit reached</p>
          <p className="mt-1.5 max-w-sm text-[13px] text-muted">
            Your Langfuse plan has a daily limit on API calls. The data will refresh automatically when the limit resets. Try again in a few hours.
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
