import { describe, it, expect } from "vitest";
import { groupByMulti } from "../transformers/multidim.js";

interface Row {
  feature: string;
  user: string;
  cost: number;
  count: number;
}

describe("groupByMulti", () => {
  const rows: Row[] = [
    { feature: "chat", user: "Coco", cost: 1.0, count: 10 },
    { feature: "chat", user: "Alice", cost: 0.5, count: 5 },
    { feature: "carousel", user: "Coco", cost: 0.3, count: 1 },
    { feature: "carousel", user: "Alice", cost: 0.2, count: 1 },
  ];

  it("groups by a single dimension", () => {
    const matrix = groupByMulti(rows, ["feature"], (r) => ({ cost: r.cost, count: r.count }));
    expect(matrix.rows.sort()).toEqual(["carousel", "chat"]);
    expect(matrix.cols).toEqual([""]);
    expect(matrix.cells["chat"]![""]).toEqual({ cost: 1.5, count: 15 });
    expect(matrix.cells["carousel"]![""]).toEqual({ cost: 0.5, count: 2 });
  });

  it("groups by two dimensions (feature × user matrix)", () => {
    const matrix = groupByMulti(rows, ["feature", "user"], (r) => ({ cost: r.cost, count: r.count }));
    expect(matrix.rows.sort()).toEqual(["carousel", "chat"]);
    expect(matrix.cols.sort()).toEqual(["Alice", "Coco"]);
    expect(matrix.cells["chat"]!["Coco"]).toEqual({ cost: 1.0, count: 10 });
    expect(matrix.cells["chat"]!["Alice"]).toEqual({ cost: 0.5, count: 5 });
    expect(matrix.cells["carousel"]!["Coco"]).toEqual({ cost: 0.3, count: 1 });
  });

  it("returns empty cells for missing combinations", () => {
    const sparse: Row[] = [{ feature: "chat", user: "Coco", cost: 1, count: 1 }];
    const matrix = groupByMulti(sparse, ["feature", "user"], (r) => ({ cost: r.cost, count: r.count }));
    expect(matrix.cells["chat"]!["Coco"]).toEqual({ cost: 1, count: 1 });
    expect(matrix.cells["chat"]!["Alice"]).toBeUndefined();
  });

  it("handles empty input", () => {
    const matrix = groupByMulti<Row, { cost: number; count: number }>([], ["feature"], (r) => ({ cost: r.cost, count: r.count }));
    expect(matrix.rows).toEqual([]);
    expect(matrix.cols).toEqual([""]);
    expect(matrix.cells).toEqual({});
  });
});
