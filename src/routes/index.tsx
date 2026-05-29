import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { aiApi, dealsApi, tasksApi, activityApi, remindersApi } from "@/api/client";
import { fmtMoney, relTime } from "@/lib/format";
import { LoadError } from "@/components/common/LoadError";
import { Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Zeus by GroVv AI" },
      { name: "description", content: "GTM platform overview: pipeline, tasks, AI status, and recent activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const ai = useQuery({ queryKey: ["ai", "status"], queryFn: () => aiApi.status(), retry: false });
  const board = useQuery({ queryKey: ["deals", "board"], queryFn: () => dealsApi.board(), retry: false });
  const today = useQuery({ queryKey: ["tasks", "today"], queryFn: () => tasksApi.list("today"), retry: false });
  const overdue = useQuery({ queryKey: ["reminders", "list"], queryFn: () => remindersApi.list(), retry: false });
  const feed = useQuery({ queryKey: ["activity", "recent"], queryFn: () => activityApi.feed(), retry: false });

  const totalPipeline =
    board.data?.stages?.reduce((sum, s) => sum + (s.total || 0), 0) ?? 0;
  const dealCount =
    board.data?.stages?.reduce((sum, s) => sum + (s.deals?.length || 0), 0) ?? 0;

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pipeline value" value={fmtMoney(totalPipeline)} hint={`${dealCount} open deals`} />
        <StatCard label="Tasks due today" value={String(today.data?.length ?? 0)} />
        <StatCard label="Reminders" value={String(overdue.data?.length ?? 0)} />
        <StatCard
          label="AI engine"
          value={ai.data?.enabled ? "Online" : ai.isError ? "Offline" : "Checking…"}
          hint={ai.data?.model ?? "Claude Opus 4.7"}
          accent={ai.data?.enabled}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Today's tasks" icon={<CheckCircle2 className="h-4 w-4" />} link={{ to: "/tasks", label: "All tasks" }}>
          {today.isError ? <LoadError error={today.error} /> :
            today.data?.length ? (
              <ul className="divide-y divide-border">
                {today.data.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{relTime(t.dueDate)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No tasks due today.</p>}
        </Panel>

        <Panel title="Upcoming reminders" icon={<AlertTriangle className="h-4 w-4" />}>
          {overdue.isError ? <LoadError error={overdue.error} /> :
            overdue.data?.length ? (
              <ul className="divide-y divide-border">
                {overdue.data.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{relTime(r.remindAt)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No reminders scheduled.</p>}
        </Panel>

        <Panel title="Recent activity" icon={<Activity className="h-4 w-4" />} link={{ to: "/activity", label: "Open feed" }}>
          {feed.isError ? <LoadError error={feed.error} /> :
            feed.data?.length ? (
              <ul className="divide-y divide-border">
                {feed.data.slice(0, 6).map((a) => (
                  <li key={a.id} className="py-2 text-sm">
                    <div className="truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{relTime(a.occurredAt)}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No recent activity.</p>}
        </Panel>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> AI quick actions
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate emails, LinkedIn messages, and call summaries from the AI Compose workspace.
        </p>
        <Link
          to="/ai-compose"
          className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open AI Compose
        </Link>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${accent ? "text-[color:var(--color-success)]" : ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Panel({
  title, icon, link, children,
}: { title: string; icon?: React.ReactNode; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        {link && (
          <Link to={link.to} className="text-xs text-primary hover:underline">{link.label}</Link>
        )}
      </header>
      {children}
    </section>
  );
}
