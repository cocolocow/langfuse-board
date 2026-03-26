export function formatTimeAgo(timestamp: string, now?: Date): string {
  const date = new Date(timestamp);
  const current = now ?? new Date();
  const diffMs = current.getTime() - date.getTime();

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
