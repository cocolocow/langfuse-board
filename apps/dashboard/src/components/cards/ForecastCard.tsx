import { formatCost } from "@langfuse-board/shared";
import type { ForecastResponse } from "@langfuse-board/shared";
import { Sparkles } from "lucide-react";

export function ForecastCard({ data }: { data: ForecastResponse }) {
  const confidencePct = Math.round(data.confidence * 100);
  const confidenceLabel =
    data.confidence >= 0.7 ? "élevée" :
    data.confidence >= 0.4 ? "moyenne" :
    "faible";
  return (
    <div className="glass-card animate-fade-in p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
          Forecast {data.days} jours
        </p>
      </div>
      <p className="mt-3 font-mono text-[26px] font-semibold leading-none tracking-tight text-foreground">
        {formatCost(data.projected.cost)}
      </p>
      <p className="mt-2 text-[11px] text-muted">
        soit ~{data.projected.traces.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} traces
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted">
        <span>Confiance {confidenceLabel}</span>
        <span className="font-mono">{confidencePct}%</span>
      </div>
    </div>
  );
}
