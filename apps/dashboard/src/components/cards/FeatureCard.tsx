import { formatCost } from "@langfuse-board/shared";
import type { FeatureRow } from "@langfuse-board/shared";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function FeatureCard({ feature, index = 0 }: { feature: FeatureRow; index?: number }) {
  const trend =
    feature.trendLastWeek === null
      ? null
      : feature.trendLastWeek > 5
      ? "up"
      : feature.trendLastWeek < -5
      ? "down"
      : "flat";
  const trendIcon =
    trend === "up" ? <TrendingUp className="h-3 w-3" /> :
    trend === "down" ? <TrendingDown className="h-3 w-3" /> :
    trend === "flat" ? <Minus className="h-3 w-3" /> : null;
  // Cost is "bad" — going up is red, going down is green
  const trendColor =
    trend === "up" ? "text-negative" :
    trend === "down" ? "text-positive" :
    "text-muted";

  return (
    <div
      className="glass-card animate-fade-in p-5"
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: "both" }}
    >
      <p className="truncate text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
        {feature.name}
      </p>
      <p className="mt-3 font-mono text-[20px] font-semibold leading-none tracking-tight text-foreground">
        {formatCost(feature.cost)}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{feature.count.toLocaleString("fr-FR")} calls</span>
        {trend && feature.trendLastWeek !== null && (
          <span className={`flex items-center gap-1 ${trendColor}`}>
            {trendIcon}
            <span>{Math.abs(feature.trendLastWeek).toFixed(0)}%</span>
          </span>
        )}
      </div>
      {(feature.topUser || feature.topPersona) && (
        <div className="mt-3 space-y-1 border-t border-border pt-2.5 text-[11px] text-muted">
          {feature.topUser && (
            <div className="flex justify-between gap-2">
              <span>Top user</span>
              <span className="truncate text-foreground-secondary">{feature.topUser}</span>
            </div>
          )}
          {feature.topPersona && feature.topPersona !== "—" && (
            <div className="flex justify-between gap-2">
              <span>Top persona</span>
              <span className="truncate text-foreground-secondary">{feature.topPersona}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
