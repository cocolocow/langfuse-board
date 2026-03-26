import { useFeed } from "../hooks/use-dashboard-data.js";
import { useConfig } from "../hooks/use-config.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatLatency, formatTimeAgo } from "@langfuse-board/shared";
import type { FeedItem } from "@langfuse-board/shared";
import { Radio } from "lucide-react";

function StatusBadge({ status }: { status: FeedItem["status"] }) {
  return status === "error" ? (
    <span className="inline-flex items-center rounded-md bg-negative-dim px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-negative">
      Err
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-positive-dim px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-positive">
      OK
    </span>
  );
}

export function Feed() {
  const { data, isLoading, error } = useFeed();
  const { data: config } = useConfig();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  const feedDimensions = config?.dimensions.filter((d) => d.show.includes("feed")) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Live</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-positive-dim px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-positive">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
          </span>
          Live
        </span>
      </div>

      <div className="glass-card animate-fade-in overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle">
                <Th>When</Th>
                <Th>Feature</Th>
                {feedDimensions.map((dim) => (
                  <Th key={dim.key}>{dim.label}</Th>
                ))}
                <Th align="right">Time</Th>
                <Th align="right">Cost</Th>
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr
                  key={item.id}
                  className="animate-fade-in border-b border-border-subtle/30 transition-colors duration-150 last:border-0 hover:bg-surface-hover/50"
                  style={{ animationDelay: `${i * 0.02}s`, animationFillMode: "both" }}
                >
                  <td className="px-4 py-2.5 text-[11px] tabular-nums text-muted">
                    {formatTimeAgo(item.timestamp)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-accent-dim px-1.5 py-0.5 font-mono text-[11px] text-accent-light">
                      {item.name}
                    </span>
                  </td>
                  {feedDimensions.map((dim) => (
                    <td key={dim.key} className="px-4 py-2.5 text-foreground-secondary">
                      {item.dimensions[dim.key] ?? (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-mono text-foreground-secondary">
                    {formatLatency(item.latencyMs)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground-secondary">
                    {formatCost(item.cost)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + feedDimensions.length + 3}
                    className="py-16 text-center"
                  >
                    <Radio className="mx-auto mb-3 h-8 w-8 text-muted/30" />
                    <p className="text-[13px] text-foreground-secondary">No requests yet</p>
                    <p className="mt-1 text-[11px] text-muted">
                      Requests will appear here as they come in
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
