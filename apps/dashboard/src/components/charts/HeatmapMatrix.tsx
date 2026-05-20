import { formatCost } from "@langfuse-board/shared";

interface Cell {
  cost: number;
  count: number;
}

interface Props {
  rows: { key: string; label?: string }[];
  cols: { key: string; label?: string }[];
  cells: Record<string, Record<string, Cell>>;
  /** Title rendered in the top-left empty cell, e.g. "Persona × Feature". */
  cornerLabel?: string;
}

/**
 * Color-graded matrix. Each cell's intensity is proportional to the cost
 * relative to the row's max. Lets the eye spot "this persona burns 80% of
 * its budget on infographic_generation" instantly.
 */
export function HeatmapMatrix({ rows, cols, cells, cornerLabel = "" }: Props) {
  // Pre-compute row maxes so we can scale color
  const rowMax: Record<string, number> = {};
  for (const r of rows) {
    let max = 0;
    for (const c of cols) {
      const v = cells[r.key]?.[c.key]?.cost ?? 0;
      if (v > max) max = v;
    }
    rowMax[r.key] = max;
  }

  return (
    <div className="glass-card overflow-x-auto p-3">
      <table className="min-w-full border-separate border-spacing-0.5 text-[11px]">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted">
              {cornerLabel}
            </th>
            {cols.map((c) => (
              <th
                key={c.key}
                className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted"
              >
                <span className="block max-w-[120px] truncate">{c.label ?? c.key}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="whitespace-nowrap px-2 py-1.5 font-medium text-foreground-secondary">
                <span className="block max-w-[160px] truncate">{r.label ?? r.key}</span>
              </td>
              {cols.map((c) => {
                const cell = cells[r.key]?.[c.key];
                const cost = cell?.cost ?? 0;
                const max = rowMax[r.key] ?? 1;
                const intensity = max > 0 ? cost / max : 0;
                const bg = `rgba(99, 102, 241, ${intensity * 0.6})`; // Electric Indigo
                return (
                  <td
                    key={c.key}
                    title={cell ? `${formatCost(cost)} · ${cell.count} calls` : "—"}
                    style={{ backgroundColor: bg }}
                    className="rounded px-2 py-1.5 font-mono text-foreground"
                  >
                    {cell ? formatCost(cost) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
