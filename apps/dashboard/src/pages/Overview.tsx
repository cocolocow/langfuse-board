import {
  useOverview,
  useAnomalies,
  useForecast,
  useFeatures,
} from "../hooks/use-dashboard-data.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { AnomalyCallout } from "../components/cards/AnomalyCallout.js";
import { ForecastCard } from "../components/cards/ForecastCard.js";
import { FeatureCard } from "../components/cards/FeatureCard.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatTokens } from "@langfuse-board/shared";

export function Overview() {
  const overview = useOverview();
  const anomalies = useAnomalies();
  const forecast = useForecast(30);
  const features = useFeatures();

  if (overview.isLoading) return <Loader />;
  if (overview.error) return <ErrorState error={overview.error} />;
  if (!overview.data) return null;

  const kpis = [
    overview.data.kpis.totalCost,
    overview.data.kpis.totalTraces,
    overview.data.kpis.avgLatency,
    overview.data.kpis.errorRate,
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-[15px] font-semibold text-foreground">Overview</h1>

      {anomalies.data && anomalies.data.items.length > 0 && (
        <AnomalyCallout anomalies={anomalies.data.items} />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <TrendChart
          data={overview.data.costTrend}
          title="Cost Trend"
          color="#6366f1"
          formatter={(v) => formatCost(v)}
        />
        {forecast.data && <ForecastCard data={forecast.data} />}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          data={overview.data.tracesTrend}
          title="Requests / Day"
          color="#818cf8"
          formatter={(v) => formatTokens(v)}
        />
        <div className="glass-card p-4">
          <h2 className="mb-3 text-[12px] font-medium uppercase tracking-widest text-muted">
            Top features
          </h2>
          {features.data && features.data.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {features.data.items.slice(0, 4).map((f, i) => (
                <FeatureCard key={f.name} feature={f} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted">Aucune donnée features</p>
          )}
        </div>
      </div>
    </div>
  );
}
