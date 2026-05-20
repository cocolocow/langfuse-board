import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { TimeseriesPoint } from "@langfuse-board/shared";

interface Series {
  label: string;
  points: TimeseriesPoint[];
}

const PALETTE = [
  "#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444",
  "#a855f7", "#ec4899", "#84cc16", "#06b6d4", "#f97316",
];

/**
 * Multi-line chart for timeseries comparisons. Used on the Trends page when
 * grouping by model / user / feature / persona.
 */
export function MultiSeriesChart({ series, height = 280, formatY }: { series: Series[]; height?: number; formatY?: (v: number) => string }) {
  // Build a flat array keyed by timestamp for Recharts
  const dates = new Set<string>();
  for (const s of series) for (const p of s.points) dates.add(p.timestamp);
  const sortedDates = Array.from(dates).sort();
  const data = sortedDates.map((d) => {
    const row: Record<string, number | string> = { timestamp: d };
    for (const s of series) {
      const point = s.points.find((p) => p.timestamp === d);
      row[s.label] = point?.value ?? 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="timestamp"
          stroke="rgba(255,255,255,0.4)"
          fontSize={11}
          tickFormatter={(t: string) => {
            const d = new Date(t);
            return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.4)"
          fontSize={11}
          tickFormatter={formatY}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,25,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={formatY ? (v: number) => formatY(v) : undefined}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Line
            key={s.label}
            type="monotone"
            dataKey={s.label}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
