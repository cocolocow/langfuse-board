import { useFeed } from "../hooks/use-dashboard-data.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { formatCost, formatLatency, formatTimeAgo } from "@langfuse-board/shared";
import type { FeedItem } from "@langfuse-board/shared";
import { Radio } from "lucide-react";

function StatusBadge({ status }: { status: FeedItem["status"] }) {
  if (status === "error") {
    return (
      <span className="inline-flex items-center rounded-full bg-negative/10 px-2 py-0.5 text-xs font-medium text-negative">
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">
      OK
    </span>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <tr className="animate-fade-in border-b border-border/50 transition-colors last:border-0 hover:bg-surface-hover">
      <td className="py-3 text-xs text-muted">
        {formatTimeAgo(item.timestamp)}
      </td>
      <td className="py-3 text-sm">
        {item.userId ?? <span className="text-muted">anonymous</span>}
      </td>
      <td className="py-3 text-sm text-accent">{item.name}</td>
      <td className="py-3 font-mono text-xs text-muted">
        {item.model ?? "—"}
      </td>
      <td className="py-3 text-right font-mono text-sm">
        {formatLatency(item.latencyMs)}
      </td>
      <td className="py-3 text-right font-mono text-sm">
        {formatCost(item.cost)}
      </td>
      <td className="py-3 text-right">
        <StatusBadge status={item.status} />
      </td>
    </tr>
  );
}

export function Feed() {
  const { data, isLoading, error } = useFeed();

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Live</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-medium text-positive">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
          </span>
          Streaming
        </span>
      </div>

      <div className="animate-fade-in rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  When
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Feature
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Model
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Response Time
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Cost
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="px-5">
              {data.items.map((item) => (
                <FeedRow key={item.id} item={item} />
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <Radio className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p>No requests yet</p>
                    <p className="mt-1 text-xs">
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
