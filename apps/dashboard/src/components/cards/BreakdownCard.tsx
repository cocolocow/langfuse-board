import { useBreakdown } from "../../hooks/use-dashboard-data.js";
import { DistributionChart } from "../charts/DistributionChart.js";
import { formatCost } from "@langfuse-board/shared";
import { Loader, ErrorState } from "../Loader.js";

export function BreakdownCard({ dimensionKey, label }: { dimensionKey: string; label: string }) {
  const { data, isLoading, error } = useBreakdown(dimensionKey);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data || data.items.length === 0) {
    return (
      <div className="animate-fade-in rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-medium text-muted">Cost by {label}</h3>
        <p className="py-8 text-center text-sm text-muted">No data</p>
      </div>
    );
  }

  const chartData = data.items.slice(0, 5).map((item) => ({
    name: item.name,
    value: item.cost,
  }));

  return (
    <DistributionChart
      data={chartData}
      title={`Cost by ${label}`}
      formatter={(v) => formatCost(v)}
    />
  );
}
