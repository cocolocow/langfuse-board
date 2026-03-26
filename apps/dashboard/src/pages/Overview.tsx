import { useOverview } from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatTokens } from "@langfuse-board/shared";

export function Overview() {
  const { data, isLoading, error } = useOverview();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard data={data.kpis.totalCost} />
        <KpiCard data={data.kpis.totalTraces} />
        <KpiCard data={data.kpis.avgLatency} />
        <KpiCard data={data.kpis.errorRate} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
