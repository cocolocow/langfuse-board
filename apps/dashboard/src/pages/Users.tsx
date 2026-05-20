import { useState } from "react";
import { useUsersDetail } from "../hooks/use-dashboard-data.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatTimeAgo } from "@langfuse-board/shared";
import type { UserDetail } from "@langfuse-board/shared";
import { ChevronRight, X } from "lucide-react";

export function Users() {
  const { data, isLoading, error } = useUsersDetail();
  const [selected, setSelected] = useState<UserDetail | null>(null);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data || data.items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-[15px] font-semibold text-foreground">Users</h1>
        <div className="glass-card p-8 text-center text-[13px] text-muted">
          Aucun utilisateur sur la période sélectionnée.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[15px] font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-[12px] text-muted">
          Top {data.items.length} par coût · clique sur une ligne pour voir le détail
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,400px)]">
        {/* Master list */}
        <div className="glass-card overflow-x-auto p-4">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-muted">
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 text-right font-medium">Coût</th>
                <th className="px-3 py-2 text-right font-medium">Calls</th>
                <th className="px-3 py-2 text-right font-medium">Dernière activité</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((u) => (
                <tr
                  key={u.userId || u.userName}
                  onClick={() => setSelected(u)}
                  className={`cursor-pointer hover:bg-surface-elevated/30 ${selected?.userId === u.userId ? "bg-surface-elevated/40" : ""}`}
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {u.userName || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-foreground-secondary">
                    {u.accountName || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {formatCost(u.totalCost)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {u.totalTraces.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {formatTimeAgo(u.lastSeen)}
                  </td>
                  <td className="px-2 text-muted">
                    <ChevronRight className="h-3 w-3" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card p-5 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">
                  {selected.userName}
                </h2>
                {selected.accountName && (
                  <p className="text-[11px] text-muted">{selected.accountName}</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded p-1 text-muted hover:bg-surface-elevated"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted">Coût</p>
                <p className="mt-1 font-mono text-[18px] text-foreground">
                  {formatCost(selected.totalCost)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted">Calls</p>
                <p className="mt-1 font-mono text-[18px] text-foreground">
                  {selected.totalTraces.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-muted">Top features</p>
              <ul className="mt-2 space-y-1">
                {selected.topFeatures.map((f) => (
                  <li key={f.name} className="flex justify-between text-[12px]">
                    <span className="truncate text-foreground-secondary">{f.name}</span>
                    <span className="ml-2 font-mono text-foreground">{formatCost(f.cost)}</span>
                  </li>
                ))}
                {selected.topFeatures.length === 0 && (
                  <li className="text-[11px] text-muted">aucune</li>
                )}
              </ul>
            </div>

            {selected.topPersonas.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest text-muted">Top personas</p>
                <ul className="mt-2 space-y-1">
                  {selected.topPersonas.map((p) => (
                    <li key={p.persona} className="flex justify-between text-[12px]">
                      <span className="truncate text-foreground-secondary">{p.persona}</span>
                      <span className="ml-2 font-mono text-foreground">{formatCost(p.cost)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
