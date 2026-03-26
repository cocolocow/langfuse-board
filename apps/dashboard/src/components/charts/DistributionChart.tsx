import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DistributionChartProps {
  data: { name: string; value: number }[];
  title: string;
  formatter?: (value: number) => string;
}

const COLORS = ["#6366f1", "#818cf8", "#34d399", "#fbbf24", "#f87171"];

export function DistributionChart({
  data,
  title,
  formatter = (v) => String(v),
}: DistributionChartProps) {
  return (
    <div className="animate-fade-in rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-medium text-muted">{title}</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#13131d",
                border: "1px solid #1e1e3a",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatter(value), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="flex-1 space-y-2">
          {data.map((item, i) => (
            <li key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 text-muted">{item.name}</span>
              <span className="font-mono text-foreground">{formatter(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
