import { useLocation, Link } from "wouter";
import { LayoutDashboard, DollarSign, Users, Activity, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/usage", label: "Usage", icon: Users },
  { href: "/quality", label: "Quality", icon: Activity },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <Zap className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          langfuse-board
        </span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent shadow-glow-sm"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-muted">Open-source LLM dashboard</p>
      </div>
    </aside>
  );
}
