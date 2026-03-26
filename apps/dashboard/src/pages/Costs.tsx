import { useCosts } from "../hooks/use-dashboard-data.js";
import { useConfig } from "../hooks/use-config.js";
import { KpiCard } from "../components/cards/KpiCard.js";
import { TrendChart } from "../components/charts/TrendChart.js";
import { DistributionChart } from "../components/charts/DistributionChart.js";
import { BreakdownCard } from "../components/cards/BreakdownCard.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost } from "@langfuse-board/shared";
import type { CostBreakdown } from "@langfuse-board/shared";

const PROVIDER_MAP: Record<string, string> = {
  "gpt": "OpenAI",
  "o1": "OpenAI",
  "o3": "OpenAI",
  "claude": "Anthropic",
  "gemini": "Google",
  "perplexity": "Perplexity",
  "llama": "Meta",
  "mistral": "Mistral",
  "deepseek": "DeepSeek",
  "command": "Cohere",
};

function groupByProvider(models: CostBreakdown[]): { name: string; value: number }[] {
  const providers = new Map<string, number>();

  for (const model of models) {
    const name = model.name.toLowerCase();
    let provider = "Other";

    for (const [prefix, providerName] of Object.entries(PROVIDER_MAP)) {
      if (name.includes(prefix)) {
        provider = providerName;
        break;
      }
    }

    providers.set(provider, (providers.get(provider) ?? 0) + model.cost);
  }

  return Array.from(providers.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function Costs() {
  const { data, isLoading, error } = useCosts();
  const { data: config } = useConfig();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  const breakdownDimensions =
    config?.dimensions.filter((d) => d.show.includes("breakdown")) ?? [];

  const byProvider = groupByProvider(data.byModel);
  const byModel = data.byModel.slice(0, 5).map((m) => ({
    name: m.name,
    value: m.cost,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-[15px] font-semibold text-foreground">Costs</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard data={data.total} index={0} />
        <KpiCard data={data.projected} index={1} />
      </div>

      <TrendChart
        data={data.trend}
        title="Daily Cost"
        color="#6366f1"
        formatter={(v) => formatCost(v)}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DistributionChart
          data={byProvider}
          title="Cost by Provider"
          formatter={(v) => formatCost(v)}
        />
        <DistributionChart
          data={byModel}
          title="Cost by Model"
          formatter={(v) => formatCost(v)}
        />
      </div>

      {breakdownDimensions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {breakdownDimensions.map((dim) => (
            <BreakdownCard key={dim.key} dimensionKey={dim.key} label={dim.label} />
          ))}
        </div>
      )}
    </div>
  );
}
