import { useEffect, useState } from "react";
import { useDateRange, PRESETS } from "../../hooks/use-date-range.js";
import { useFreshness } from "../../hooks/use-freshness.js";
import { useQuotaStatus } from "../../hooks/use-dashboard-data.js";
import { Calendar, RefreshCw, Activity } from "lucide-react";

function formatRelative(epochMs: number | null): string {
  if (!epochMs) return "";
  const ageMs = Date.now() - epochMs;
  if (ageMs < 0) return "à l'instant";
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatCountdown(retryAt: number | null): string {
  if (!retryAt) return "";
  const remainingMs = retryAt - Date.now();
  if (remainingMs <= 0) return "disponible";
  const sec = Math.ceil(remainingMs / 1000);
  if (sec < 60) return `dans ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `dans ${min} min`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `dans ${hours}h ${remMin}min` : `dans ${hours}h`;
}

export function Header() {
  const { range, setRange } = useDateRange();
  const { meta, refresh } = useFreshness();
  const quota = useQuotaStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tick every 15s so "il y a Xmin" / countdown stay accurate without React Query churn
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const retryAt = meta?.retryAt ?? null;
  const isRateLimited = retryAt !== null && retryAt > Date.now();

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const cachedAt = meta?.cachedAt ?? null;
  const stale = meta?.stale ?? false;

  // The tracker counts ONLY this board's outbound calls — not ingestion from
  // ECS, nor other clients hitting the same Langfuse project. So we don't show
  // an "X/100" denominator (misleading: when rate-limited, the real number is
  // 100/100 even if the board's own counter is at 4). Just the raw count, with
  // colors triggered by whether we're CURRENTLY rate-limited (authoritative
  // signal from Langfuse), not by our local estimate.
  const quotaUsed = quota.data?.usedLast24h ?? 0;

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-2.5 backdrop-blur-xl">
      <div className="flex items-center gap-3 text-[11px] text-muted">
        {cachedAt && (
          <span className={stale ? "text-amber-400" : ""}>
            {stale ? "Données figées · " : "Dernières données "}
            {formatRelative(cachedAt)}
          </span>
        )}
        {isRateLimited && (
          <span className="text-amber-400" title="Quota free Langfuse Cloud (100 req/jour) épuisé">
            Quota épuisé · re-dispo {formatCountdown(retryAt)}
          </span>
        )}
        {quota.data && (
          <span
            className="flex items-center gap-1 text-muted"
            title={
              "Nombre de requêtes que CE board a envoyées à Langfuse sur les 24 dernières heures.\n\n" +
              "Ce compteur ne reflète PAS le quota global Langfuse — l'ingestion de traces depuis ton ECS Dualis et d'autres clients consomment aussi le quota mais ne sont pas comptés ici."
            }
          >
            <Activity className="h-3 w-3" />
            <span className="font-mono">{quotaUsed}</span>
            <span>appels du board (24h)</span>
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing || isRateLimited}
          title={isRateLimited ? `Disponible ${formatCountdown(retryAt)}` : "Forcer un re-fetch"}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] font-medium text-foreground-secondary transition-all duration-200 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Chargement…" : "Rafraîchir"}
        </button>
      </div>
      <div className="flex items-center gap-2.5">
        <Calendar className="h-3.5 w-3.5 text-muted" />
        <div className="flex gap-0.5 rounded-lg bg-background/80 p-0.5">
          {Object.entries(PRESETS).map(([label, factory]) => (
            <button
              key={label}
              onClick={() => setRange(factory())}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                range.label === label
                  ? "bg-accent/90 text-white shadow-glow-sm"
                  : "text-muted hover:text-foreground-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
