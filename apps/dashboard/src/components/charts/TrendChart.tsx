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
  const gradientId = `grad-${title.replace(/\s/g, "-")}`;

  return (
    <div className="glass-card animate-fade-in p-5">
      <h3 className="mb-5 text-[11px] font-medium uppercase tracking-widest text-muted">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(99, 102, 241, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="#6b6b80"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#6b6b80"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatter}
            dx={-4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 15, 26, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(99, 102, 241, 0.12)",
              borderRadius: "12px",
              color: "#eeeef0",
              fontSize: "12px",
              padding: "8px 12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [formatter(value), ""]}
            cursor={{ stroke: "rgba(99, 102, 241, 0.2)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: color,
              fill: "#07070d",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
