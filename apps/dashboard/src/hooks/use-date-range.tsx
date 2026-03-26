import { createContext, useContext, useState, type ReactNode } from "react";

interface DateRange {
  from: string;
  to: string;
  granularity: "hour" | "day" | "week" | "month";
  label: string;
}

interface DateRangeContextValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
  queryString: string;
}

const PRESETS: Record<string, () => DateRange> = {
  "Last 7 days": () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: "day",
      label: "Last 7 days",
    };
  },
  "Last 30 days": () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: "day",
      label: "Last 30 days",
    };
  },
  "Last 90 days": () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity: "week",
      label: "Last 90 days",
    };
  },
  "This month": () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
      granularity: "day",
      label: "This month",
    };
  },
};

export { PRESETS };

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(PRESETS["Last 30 days"]!());

  const queryString = `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&granularity=${range.granularity}`;

  return (
    <DateRangeContext.Provider value={{ range, setRange, queryString }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
