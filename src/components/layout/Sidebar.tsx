import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Building2,
  Activity,
  CheckSquare,
  Sparkles,
  Settings,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { aiApi } from "@/api/client";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/deals", label: "Deals", icon: KanbanSquare },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/ai-compose", label: "AI Compose", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: ai } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: () => aiApi.status(),
    refetchOnWindowFocus: false,
    retry: false,
  });
  const aiEnabled = ai?.enabled ?? false;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Zap className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Zeus</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            by GroVv AI
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2">
        {items.map((it) => {
          const active =
            it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/40 hover:text-accent-foreground",
              )}
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              aiEnabled ? "bg-[color:var(--color-success)]" : "bg-muted-foreground",
            )}
          />
          <span className="text-muted-foreground">
            AI {aiEnabled ? "online" : "unavailable"}
          </span>
        </div>
      </div>
    </aside>
  );
}
