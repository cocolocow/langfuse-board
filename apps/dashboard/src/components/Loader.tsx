import { AlertCircle } from "lucide-react";

export function Loader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card h-[106px] p-5">
            <div className="h-2.5 w-16 rounded bg-surface-elevated" />
            <div className="mt-4 h-6 w-24 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card h-[290px] p-5">
            <div className="h-2.5 w-20 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-negative-dim">
        <AlertCircle className="h-5 w-5 text-negative" />
      </div>
      <p className="text-[13px] text-foreground-secondary">{message}</p>
    </div>
  );
}
