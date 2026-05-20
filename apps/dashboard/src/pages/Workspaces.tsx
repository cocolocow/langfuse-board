import { useBreakdown } from "../hooks/use-dashboard-data.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost } from "@langfuse-board/shared";

export function Workspaces() {
  const { data, isLoading, error } = useBreakdown("account_name");
  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-[15px] font-semibold text-foreground">Workspaces</h1>
        <div className="glass-card p-8 text-center text-[13px] text-muted">
          Aucun workspace identifié sur la période.
        </div>
      </div>
    );
  }

  const total = data.items.reduce((s, w) => s + w.cost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-foreground">Workspaces</h1>
        <p className="mt-1 text-[12px] text-muted">
          {data.items.length} workspaces · {formatCost(total)} sur la période
        </p>
      </div>

      <div className="glass-card overflow-x-auto p-4">
        <table className="min-w-full text-[12px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-muted">
              <th className="px-3 py-2 font-medium">Workspace</th>
              <th className="px-3 py-2 text-right font-medium">Coût</th>
              <th className="px-3 py-2 text-right font-medium">% du total</th>
              <th className="px-3 py-2 text-right font-medium">Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((w) => (
              <tr key={w.name} className="hover:bg-surface-elevated/30">
                <td className="px-3 py-2 font-medium text-foreground">
                  {w.name}
                </td>
                <td className="px-3 py-2 text-right font-mono text-foreground">
                  {formatCost(w.cost)}
                </td>
                <td className="px-3 py-2 text-right text-muted">
                  {w.percentage.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-muted">
                  {w.count.toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
