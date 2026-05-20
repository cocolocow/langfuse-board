import { useState } from "react";
import { useTimeseries, useAnomalies, useForecast } from "../hooks/use-dashboard-data.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { MultiSeriesChart } from "../components/charts/MultiSeriesChart.js";
import { AnomalyCallout } from "../components/cards/AnomalyCallout.js";
import { ForecastCard } from "../components/cards/ForecastCard.js";
import { formatCost } from "@langfuse-board/shared";

type Metric = "cost" | "tokens" | "traces";
type GroupBy = "none" | "model" | "user" | "feature" | "persona";

export function Trends() {
  const [metric, setMetric] = useState<Metric>("cost");
  const [groupBy, setGroupBy] = useState<GroupBy>("feature");

  const ts = useTimeseries(metric, groupBy);
  const anomalies = useAnomalies();
  const forecast = useForecast(30);

  if (ts.isLoading) return <Loader />;
  if (ts.error) return <ErrorState error={ts.error} />;

  const formatY =
    metric === "cost"
      ? (v: number) => formatCost(v)
      : (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">Trends</h1>
          <p className="mt-1 text-[12px] text-muted">
            Évolutions, anomalies, projections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] text-muted">
            <span>Métrique</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Metric)}
              className="rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] text-foreground"
            >
              <option value="cost">Coût</option>
              <option value="tokens">Tokens</option>
              <option value="traces">Calls</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-muted">
            <span>Grouper par</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] text-foreground"
            >
              <option value="none">Total</option>
              <option value="model">Modèle</option>
              <option value="user">User</option>
              <option value="feature">Feature</option>
              <option value="persona">Persona</option>
            </select>
          </label>
        </div>
      </div>

      {/* Forecast + anomalies side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
        {forecast.data ? (
          <ForecastCard data={forecast.data} />
        ) : (
          <div className="glass-card p-5 text-[11px] text-muted">Forecast indisponible</div>
        )}
        {anomalies.data && anomalies.data.items.length > 0 ? (
          <AnomalyCallout anomalies={anomalies.data.items} />
        ) : (
          <div className="glass-card p-5 text-[11px] text-muted">
            Aucune anomalie détectée sur les 14 derniers jours
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-3 text-[12px] font-medium uppercase tracking-widest text-muted">
          {metric === "cost" ? "Coût" : metric === "tokens" ? "Tokens" : "Calls"} par jour
          {groupBy !== "none" && ` × ${groupBy}`}
        </h2>
        {ts.data && ts.data.series.length > 0 ? (
          <MultiSeriesChart series={ts.data.series} formatY={formatY} height={320} />
        ) : (
          <p className="py-8 text-center text-[12px] text-muted">Aucune donnée</p>
        )}
      </div>
    </div>
  );
}
