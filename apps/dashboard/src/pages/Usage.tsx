import { useUsage } from "../hooks/use-dashboard-data.js";
import { useConfig } from "../hooks/use-config.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { BreakdownCard } from "../components/cards/BreakdownCard.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatTokens } from "@langfuse-board/shared";

export function Usage() {
  const { data, isLoading, error } = useUsage();
  const { data: config } = useConfig();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  const breakdownDimensions =
    config?.dimensions.filter((d) => d.show.includes("breakdown")) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Usage</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard data={data.totalTraces} />
        <KpiCard data={data.totalTokens} />
        <KpiCard data={data.activeUsers} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart
          data={data.tracesTrend}
          title="Requests / Day"
          color="#6366f1"
          formatter={(v) => formatTokens(v)}
        />
        <TrendChart
          data={data.tokensTrend}
          title="Words Processed / Day"
          color="#34d399"
          formatter={(v) => formatTokens(v)}
        />
      </div>

      {breakdownDimensions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {breakdownDimensions.map((dim) => (
            <BreakdownCard key={dim.key} dimensionKey={dim.key} label={dim.label} />
          ))}
        </div>
      )}
    </div>
  );
}
