import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TimeseriesPoint } from "@langfuse-board/shared";

interface TrendChartProps {
  data: TimeseriesPoint[];
  title: string;
  color?: string;
  formatter?: (value: number) => string;
}

function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({
  data,
  title,
  color = "#6366f1",
  formatter = (v) => String(v),
}: TrendChartProps) {
  return (
    <div className="animate-fade-in rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-medium text-muted">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e1e3a"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#13131d",
              border: "1px solid #1e1e3a",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "12px",
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [formatter(value), ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${title})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
