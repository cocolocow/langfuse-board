import { useCosts } from "../hooks/use-dashboard-data.js";
import { useConfig } from "../hooks/use-config.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { BreakdownCard } from "../components/cards/BreakdownCard.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost } from "@langfuse-board/shared";

export function Costs() {
  const { data, isLoading, error } = useCosts();
  const { data: config } = useConfig();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  const breakdownDimensions =
    config?.dimensions.filter((d) => d.show.includes("breakdown")) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-[15px] font-semibold text-foreground">Costs</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard data={data.total} />
        <KpiCard data={data.projected} />
      </div>

      <TrendChart
        data={data.trend}
        title="Daily Cost"
        color="#6366f1"
        formatter={(v) => formatCost(v)}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {breakdownDimensions.map((dim) => (
          <BreakdownCard key={dim.key} dimensionKey={dim.key} label={dim.label} />
        ))}
      </div>
    </div>
  );
}
