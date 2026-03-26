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

export function KpiCard({ data, index = 0 }: { data: KpiData; index?: number }) {
  const trendIcon =
    data.trend?.direction === "up" ? (
      <TrendingUp className="h-3 w-3" />
    ) : data.trend?.direction === "down" ? (
      <TrendingDown className="h-3 w-3" />
    ) : (
      <Minus className="h-3 w-3" />
    );

  const isNegativeMetric =
    data.label.toLowerCase().includes("cost") ||
    data.label.toLowerCase().includes("error");

  const trendColor =
    data.trend?.direction === "up"
      ? isNegativeMetric ? "text-negative" : "text-positive"
      : data.trend?.direction === "down"
        ? isNegativeMetric ? "text-positive" : "text-negative"
        : "text-muted";

  return (
    <div
      className="glass-card animate-fade-in p-5 transition-all duration-300"
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: "both" }}
    >
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
        {data.label}
      </p>
      <p className="mt-3 font-mono text-[26px] font-semibold leading-none tracking-tight text-foreground">
        {formatKpiValue(data)}
      </p>
      {data.trend && (
        <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${trendColor}`}>
          {trendIcon}
          <span>{Math.abs(data.trend.delta).toFixed(1)}%</span>
          <span className="text-muted">vs prev</span>
        </div>
      )}
    </div>
  );
}
