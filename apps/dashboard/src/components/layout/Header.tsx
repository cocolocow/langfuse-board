import { useDateRange, PRESETS } from "../../hooks/use-date-range.js";
import { Calendar } from "lucide-react";

export function Header() {
  const { range, setRange } = useDateRange();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-2.5 backdrop-blur-xl">
      <div />
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
