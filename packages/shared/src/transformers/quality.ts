export function calculateErrorRate(
  totalTraces: number,
  errorTraces: number,
): number {
  if (totalTraces === 0) return 0;
  return (errorTraces / totalTraces) * 100;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const seconds = ms / 1000;
  const formatted = seconds.toFixed(1);
  return formatted.endsWith(".0")
    ? `${formatted.slice(0, -2)}s`
    : `${formatted}s`;
}
