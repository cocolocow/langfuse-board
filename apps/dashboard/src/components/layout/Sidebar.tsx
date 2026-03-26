import { useLocation, Link } from "wouter";
import { LayoutDashboard, DollarSign, Users, Activity, Radio, Settings, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/usage", label: "Usage", icon: Users },
  { href: "/quality", label: "Performance", icon: Activity },
  { href: "/live", label: "Live", icon: Radio },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="flex w-[220px] flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-dim">
          <Zap className="h-3.5 w-3.5 text-accent-light" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          langfuse-board
        </span>
      </div>

      <nav className="flex-1 px-3 pt-1">
        <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-muted">
          Dashboard
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-accent-dim text-accent-light"
                      : "text-muted hover:bg-surface-hover hover:text-foreground-secondary"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-accent" : "text-muted group-hover:text-foreground-secondary"}`} />
                  {label}
                  {label === "Live" && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-positive opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-border-subtle" />

        <ul>
          <li>
            <Link
              href="/settings"
              className={`group flex items-center gap-3 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-200 ${
                location === "/settings"
                  ? "bg-accent-dim text-accent-light"
                  : "text-muted hover:bg-surface-hover hover:text-foreground-secondary"
              }`}
            >
              <Settings className={`h-4 w-4 transition-colors ${location === "/settings" ? "text-accent" : "text-muted group-hover:text-foreground-secondary"}`} />
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
