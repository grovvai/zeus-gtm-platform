import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { tasksApi, remindersApi } from "@/api/client";
import { LoadError } from "@/components/common/LoadError";
import { fmtDateTime, relTime } from "@/lib/format";
import { toast } from "sonner";
import { Bell, Check, RotateCcw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks & Reminders — Zeus" }] }),
  component: TasksPage,
});

type Filter = "today" | "overdue" | "week" | "all";

function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("today");
  const tasks = useQuery({ queryKey: ["tasks", filter], queryFn: () => tasksApi.list(filter), retry: false });
  const reminders = useQuery({ queryKey: ["reminders"], queryFn: () => remindersApi.list(), retry: false });

  const [newTitle, setNewTitle] = useState("");
  const create = useMutation({
    mutationFn: () => tasksApi.create({ title: newTitle, dueDate: new Date().toISOString() }),
    onSuccess: () => { setNewTitle(""); qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task created"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const complete = useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const reopen = useMutation({
    mutationFn: (id: string) => tasksApi.reopen(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const [rTitle, setRTitle] = useState("");
  const [rWhen, setRWhen] = useState("");
  const schedule = useMutation({
    mutationFn: () => remindersApi.schedule({ title: rTitle, remindAt: new Date(rWhen).toISOString() }),
    onSuccess: () => { setRTitle(""); setRWhen(""); qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Reminder scheduled"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => remindersApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return (
    <AppShell title="Tasks & Reminders">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Tasks</h2>
            <div className="flex gap-1">
              {(["today", "overdue", "week", "all"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md border px-2 py-1 text-xs capitalize ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >{f}</button>
              ))}
            </div>
          </header>

          <form
            onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) create.mutate(); }}
            className="mb-3 flex gap-2"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New task…"
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Add</button>
          </form>

          {tasks.isError && <LoadError error={tasks.error} />}
          {tasks.data && (
            <ul className="divide-y divide-border">
              {tasks.data.map((t) => {
                const done = !!t.completedAt;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className={`truncate ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                      <div className="text-xs text-muted-foreground">Due {relTime(t.dueDate)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {done ? (
                        <button onClick={() => reopen.mutate(t.id)} className="rounded-md border border-border p-1.5 hover:border-primary" title="Reopen">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => complete.mutate(t.id)} className="rounded-md border border-border p-1.5 hover:border-primary" title="Complete">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
              {tasks.data.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No tasks.</li>}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4" /> Reminders</h2>
          <form
            onSubmit={(e) => { e.preventDefault(); if (rTitle && rWhen) schedule.mutate(); }}
            className="mb-3 space-y-2"
          >
            <input
              value={rTitle}
              onChange={(e) => setRTitle(e.target.value)}
              placeholder="Remind me to…"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="datetime-local"
              value={rWhen}
              onChange={(e) => setRWhen(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Schedule</button>
          </form>

          {reminders.isError && <LoadError error={reminders.error} />}
          {reminders.data && (
            <ul className="divide-y divide-border">
              {reminders.data.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(r.remindAt)}</div>
                  </div>
                  <button onClick={() => cancel.mutate(r.id)} className="rounded-md border border-border p-1.5 hover:border-destructive" title="Cancel">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {reminders.data.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No reminders.</li>}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
