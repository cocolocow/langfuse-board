import type { KpiData } from "@langfuse-board/shared";
import {
  formatCost,
  formatLatency,
  formatTokens,
} from "@langfuse-board/shared";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function formatKpiValue(kpi: KpiData): string {
  switch (kpi.unit) {
    case "currency":
      return formatCost(kpi.value);
    case "duration":
      return formatLatency(kpi.value);
    case "percent":
      return `${kpi.value.toFixed(1)}%`;
    case "number":
      return formatTokens(kpi.value);
    default:
      return String(kpi.value);
  }
}

export function KpiCard({ data }: { data: KpiData }) {
  const trendIcon =
    data.trend?.direction === "up" ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : data.trend?.direction === "down" ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : (
      <Minus className="h-3.5 w-3.5" />
    );

  const trendColor =
    data.trend?.direction === "up"
      ? data.label.toLowerCase().includes("cost") || data.label.toLowerCase().includes("error")
        ? "text-negative"
        : "text-positive"
      : data.trend?.direction === "down"
        ? data.label.toLowerCase().includes("cost") || data.label.toLowerCase().includes("error")
          ? "text-positive"
          : "text-negative"
        : "text-muted";

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-glow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {data.label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
        {formatKpiValue(data)}
      </p>
      {data.trend && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendIcon}
          <span>{Math.abs(data.trend.delta).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
