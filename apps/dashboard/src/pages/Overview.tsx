import { useOverview } from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatTokens } from "@langfuse-board/shared";

export function Overview() {
  const { data, isLoading, error } = useOverview();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  const kpis = [data.kpis.totalCost, data.kpis.totalTraces, data.kpis.avgLatency, data.kpis.errorRate];

  return (
    <div className="space-y-6">
      <h1 className="text-[15px] font-semibold text-foreground">Overview</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          data={data.costTrend}
          title="Cost Trend"
          color="#6366f1"
          formatter={(v) => formatCost(v)}
        />
        <TrendChart
          data={data.tracesTrend}
          title="Requests / Day"
          color="#818cf8"
          formatter={(v) => formatTokens(v)}
        />
      </div>
    </div>
  );
}
