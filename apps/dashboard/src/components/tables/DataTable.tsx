interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: "left" | "right";
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  title: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
}: DataTableProps<T>) {
  return (
    <div className="glass-card animate-fade-in p-5">
      <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-muted">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`pb-2.5 text-[10px] font-medium uppercase tracking-widest text-muted ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border-subtle/50 transition-colors duration-150 last:border-0 hover:bg-surface-hover/50"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`py-2.5 font-mono text-foreground-secondary ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-[13px] text-muted"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
