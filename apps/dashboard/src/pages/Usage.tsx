import { useUsage } from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { BarBreakdown } from "../components/charts/BarBreakdown.js";
import { DataTable } from "../components/tables/DataTable.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatTokens } from "@langfuse-board/shared";

export function Usage() {
  const { data, isLoading, error } = useUsage();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarBreakdown
          data={data.topModels.map((m) => ({
            name: m.model,
            value: m.tokens,
          }))}
          title="Words by Model"
          formatter={(v) => formatTokens(v)}
        />
        <DataTable
          data={data.topUsers.map((u) => ({
            userId: u.userId,
            traces: u.traces,
            cost: u.cost,
          }))}
          columns={[
            { key: "userId", label: "User" },
            { key: "traces", label: "Traces", align: "right" },
            {
              key: "cost",
              label: "Cost",
              align: "right",
              render: (v) => formatCost(v as number),
            },
          ]}
          title="Top Users"
        />
      </div>
    </div>
  );
}
