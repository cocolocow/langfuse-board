import { usePersonas } from "../hooks/use-dashboard-data.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { HeatmapMatrix } from "../components/charts/HeatmapMatrix.js";
import { formatCost } from "@langfuse-board/shared";

export function Personas() {
  const { data, isLoading, error } = usePersonas();
  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-[15px] font-semibold text-foreground">Personas</h1>
        <div className="glass-card p-8 text-center text-[13px] text-muted">
          Aucun persona actif sur la période.
        </div>
      </div>
    );
  }

  // Build heatmap rows/cols
  const rows = data.items.map((p) => ({ key: p.persona, label: p.persona }));
  const featureSet = new Set<string>();
  for (const p of data.items) for (const f of p.topFeatures) featureSet.add(f.name);
  const cols = Array.from(featureSet).slice(0, 8).map((f) => ({ key: f, label: f }));
  const cells: Record<string, Record<string, { cost: number; count: number }>> = {};
  for (const p of data.items) {
    cells[p.persona] = {};
    for (const f of p.topFeatures) {
      cells[p.persona]![f.name] = { cost: f.cost, count: 0 };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-foreground">Personas</h1>
        <p className="mt-1 text-[12px] text-muted">
          {data.items.length} personas actifs · cliquer sur une carte pour drill-down (à venir)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((p, i) => (
          <div
            key={p.persona}
            className="glass-card animate-fade-in p-5"
            style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
          >
            <p className="truncate text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
              {p.persona}
            </p>
            <p className="mt-3 font-mono text-[20px] font-semibold leading-none tracking-tight text-foreground">
              {formatCost(p.cost)}
            </p>
            <p className="mt-2 text-[11px] text-muted">
              {p.count.toLocaleString("fr-FR")} calls
            </p>
            {p.topFeatures.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-border pt-2.5 text-[11px]">
                <p className="text-muted">Top features</p>
                {p.topFeatures.slice(0, 3).map((f) => (
                  <div key={f.name} className="flex justify-between gap-2">
                    <span className="truncate text-foreground-secondary">{f.name}</span>
                    <span className="font-mono text-foreground">{formatCost(f.cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {cols.length > 0 && (
        <div>
          <h2 className="mb-2 text-[12px] font-medium uppercase tracking-widest text-muted">
            Heatmap Persona × Feature
          </h2>
          <HeatmapMatrix rows={rows} cols={cols} cells={cells} cornerLabel="Persona" />
        </div>
      )}
    </div>
  );
}
