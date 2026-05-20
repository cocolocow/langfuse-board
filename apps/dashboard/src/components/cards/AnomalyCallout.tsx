import { AlertTriangle } from "lucide-react";
import { formatCost } from "@langfuse-board/shared";
import type { AnomalyEvent } from "@langfuse-board/shared";

function describe(a: AnomalyEvent): string {
  const [_, max] = a.expectedRange;
  const direction = a.value > max ? "spike" : "drop";
  const [namespace, name] = a.dimension.split(":");
  const label =
    namespace === "feature" ? `la feature ${name}` :
    namespace === "user" ? `l'utilisateur ${name}` :
    namespace === "total" ? "le coût global" :
    a.dimension;
  const dateLabel = new Date(a.date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short",
  });
  return `${direction === "spike" ? "Pic" : "Baisse"} sur ${label} le ${dateLabel} — ${formatCost(a.value)} (attendu max ${formatCost(max)})`;
}

export function AnomalyCallout({ anomalies }: { anomalies: AnomalyEvent[] }) {
  if (anomalies.length === 0) return null;

  // Surface the 3 most recent or most extreme
  const topAnomalies = [...anomalies]
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, 3);

  return (
    <div className="glass-card border-l-2 border-amber-400/60 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-amber-400">
            {anomalies.length === 1 ? "1 anomalie détectée" : `${anomalies.length} anomalies détectées`}
          </p>
          <ul className="space-y-1 text-[13px] text-foreground-secondary">
            {topAnomalies.map((a) => (
              <li key={`${a.dimension}-${a.date}`}>{describe(a)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
