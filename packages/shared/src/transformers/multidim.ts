export type CellValue = {
  cost: number;
  count: number;
} & Record<string, number>;

export interface Matrix<V extends Record<string, number> = CellValue> {
  rows: string[];
  cols: string[];
  cells: Record<string, Record<string, V>>;
}

/**
 * Group rows by 1 or 2 dimensions and aggregate numeric values per cell.
 *
 * - 1 dimension → matrix with a single column (key = ""). Caller treats it as a list.
 * - 2 dimensions → first key is rows, second is cols. Cells are sums.
 *
 * This powers the breakdown endpoint when called with `key=feature_category,user_name`
 * to produce a heatmap.
 */
export function groupByMulti<T, V extends Record<string, number>>(
  rows: T[],
  keys: (keyof T)[],
  pick: (row: T) => V,
): Matrix<V> {
  if (keys.length === 0 || keys.length > 2) {
    throw new Error("groupByMulti supports 1 or 2 keys");
  }
  const cells: Record<string, Record<string, V>> = {};
  const rowSet = new Set<string>();
  const colSet = new Set<string>();

  for (const row of rows) {
    const r = String(row[keys[0]!] ?? "");
    const c = keys.length === 2 ? String(row[keys[1]!] ?? "") : "";
    rowSet.add(r);
    if (keys.length === 2) colSet.add(c);

    const value = pick(row);
    cells[r] ??= {};
    const existing = cells[r]![c];
    if (existing) {
      const merged = { ...existing } as V;
      for (const k of Object.keys(value) as (keyof V)[]) {
        merged[k] = ((existing[k] as number) + (value[k] as number)) as V[keyof V];
      }
      cells[r]![c] = merged;
    } else {
      cells[r]![c] = { ...value };
    }
  }

  return {
    rows: Array.from(rowSet),
    cols: keys.length === 2 ? Array.from(colSet) : [""],
    cells,
  };
}
