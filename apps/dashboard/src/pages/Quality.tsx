import { useQuality } from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { DataTable } from "../components/tables/DataTable.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatLatency } from "@langfuse-board/shared";

export function Quality() {
  const { data, isLoading, error } = useQuality();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Performance</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard data={data.avgLatency} />
        <KpiCard data={data.p95Latency} />
        <KpiCard data={data.errorRate} />
      </div>

      <TrendChart
        data={data.latencyTrend}
        title="Average Response Time"
        color="#fbbf24"
        formatter={(v) => formatLatency(v)}
      />

      {data.scores.length > 0 && (
        <DataTable
          data={data.scores.map((s) => ({
            name: s.name,
            avg: s.avg,
            count: s.count,
          }))}
          columns={[
            { key: "name", label: "Score" },
            {
              key: "avg",
              label: "Average",
              align: "right",
              render: (v) => (v as number).toFixed(2),
            },
            { key: "count", label: "Count", align: "right" },
          ]}
          title="Quality Scores"
        />
      )}
    </div>
  );
}
