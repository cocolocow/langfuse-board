import { useFeatures } from "../hooks/use-dashboard-data.js";
import { FeatureCard } from "../components/cards/FeatureCard.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost } from "@langfuse-board/shared";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function Features() {
  const { data, isLoading, error } = useFeatures();
  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-[15px] font-semibold text-foreground">Features</h1>
        <div className="glass-card p-8 text-center text-[13px] text-muted">
          Aucune donnée sur la période sélectionnée.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">Features</h1>
          <p className="mt-1 text-[12px] text-muted">
            {data.items.length} features tracées · total {formatCost(data.totalCost)}
          </p>
        </div>
      </div>

      {/* Top 6 in card form */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.slice(0, 6).map((f, i) => (
          <FeatureCard key={f.name} feature={f} index={i} />
        ))}
      </div>

      {/* Full table */}
      <div className="glass-card overflow-x-auto p-4">
        <table className="min-w-full text-[12px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-muted">
              <th className="px-3 py-2 font-medium">Feature</th>
              <th className="px-3 py-2 text-right font-medium">Coût</th>
              <th className="px-3 py-2 text-right font-medium">% du total</th>
              <th className="px-3 py-2 text-right font-medium">Calls</th>
              <th className="px-3 py-2 text-right font-medium">WoW</th>
              <th className="px-3 py-2 font-medium">Top user</th>
              <th className="px-3 py-2 font-medium">Top persona</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((f) => {
              const pct = data.totalCost > 0 ? (f.cost / data.totalCost) * 100 : 0;
              const trendDirection =
                f.trendLastWeek === null
                  ? "flat"
                  : f.trendLastWeek > 5
                  ? "up"
                  : f.trendLastWeek < -5
                  ? "down"
                  : "flat";
              const trendIcon =
                trendDirection === "up" ? <TrendingUp className="h-3 w-3" /> :
                trendDirection === "down" ? <TrendingDown className="h-3 w-3" /> :
                <Minus className="h-3 w-3" />;
              const trendColor =
                trendDirection === "up" ? "text-negative" :
                trendDirection === "down" ? "text-positive" :
                "text-muted";
              return (
                <tr key={f.name} className="hover:bg-surface-elevated/30">
                  <td className="px-3 py-2 font-mono text-foreground-secondary">
                    {f.name}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatCost(f.cost)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {pct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {f.count.toLocaleString("fr-FR")}
                  </td>
                  <td className={`px-3 py-2 text-right ${trendColor}`}>
                    {f.trendLastWeek === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {trendIcon}
                        {Math.abs(f.trendLastWeek).toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-foreground-secondary">
                    {f.topUser ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground-secondary">
                    {f.topPersona ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
