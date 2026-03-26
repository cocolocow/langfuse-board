import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DistributionChartProps {
  data: { name: string; value: number }[];
  title: string;
  formatter?: (value: number) => string;
}

const COLORS = ["#6366f1", "#818cf8", "#10b981", "#f59e0b", "#ef4444"];

export function DistributionChart({
  data,
  title,
  formatter = (v) => String(v),
}: DistributionChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card animate-fade-in p-5">
      <h3 className="mb-5 text-[11px] font-medium uppercase tracking-widest text-muted">{title}</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
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
              formatter={(value: number) => [formatter(value), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex-1 space-y-2.5">
          {data.map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
            return (
              <li key={item.name} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="flex-1 truncate text-foreground-secondary">{item.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted">{pct}%</span>
                <span className="shrink-0 font-mono text-xs text-foreground">{formatter(item.value)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
