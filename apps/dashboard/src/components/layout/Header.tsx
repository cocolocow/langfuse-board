import { useDateRange, PRESETS } from "../../hooks/use-date-range.js";
import { Calendar } from "lucide-react";

export function Header() {
  const { range, setRange } = useDateRange();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div />
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted" />
        <div className="flex gap-1 rounded-lg bg-background p-1">
          {Object.entries(PRESETS).map(([label, factory]) => (
            <button
              key={label}
              onClick={() => setRange(factory())}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                range.label === label
                  ? "bg-accent text-white shadow-glow-sm"
                  : "text-muted hover:text-foreground"
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
