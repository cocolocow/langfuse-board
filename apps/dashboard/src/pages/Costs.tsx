import { useCosts } from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { DistributionChart } from "../components/charts/DistributionChart.js";
import { DataTable } from "../components/tables/DataTable.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost } from "@langfuse-board/shared";

export function Costs() {
  const { data, isLoading, error } = useCosts();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  const donutData = data.byModel.map((m) => ({
    name: m.name,
    value: m.cost,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Costs</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard data={data.total} />
        <KpiCard data={data.projected} />
      </div>

      <TrendChart
        data={data.trend}
        title="Daily Cost"
        color="#6366f1"
        formatter={(v) => formatCost(v)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistributionChart
          data={donutData}
          title="Cost by Model"
          formatter={(v) => formatCost(v)}
        />
        <DataTable
          data={data.byTraceName.map((t) => ({
            name: t.name,
            cost: t.cost,
            percentage: t.percentage,
            tokens: t.tokens,
          }))}
          columns={[
            { key: "name", label: "Feature" },
            {
              key: "cost",
              label: "Cost",
              align: "right",
              render: (v) => formatCost(v as number),
            },
            {
              key: "percentage",
              label: "%",
              align: "right",
              render: (v) => `${(v as number).toFixed(1)}%`,
            },
          ]}
          title="Cost by Feature"
        />
      </div>
    </div>
  );
}
