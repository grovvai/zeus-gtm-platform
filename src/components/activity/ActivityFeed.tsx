import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActivityFeedItem, ActivityType } from "@/types";
import { activityApi } from "@/api/client";
import { relTime } from "@/lib/format";
import { LoadError } from "@/components/common/LoadError";
import { Mail, Linkedin, CheckSquare, ArrowRightCircle, StickyNote, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

const typeMeta: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  email: { icon: Mail, label: "Email" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  task: { icon: CheckSquare, label: "Task" },
  stage_change: { icon: ArrowRightCircle, label: "Stage" },
  note: { icon: StickyNote, label: "Note" },
};

export function ActivityFeed({
  query,
  target,
}: {
  query: UseQueryResult<ActivityFeedItem[], unknown>;
  target?: { contactId?: string; companyId?: string; dealId?: string };
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  const addNote = useMutation({
    mutationFn: () => activityApi.notes.create({ body: note, ...target }),
    onSuccess: () => {
      setNote("");
      toast.success("Note added");
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  });

  if (query.isError) return <LoadError error={query.error} />;

  const items = (query.data ?? []).filter((i) => filter === "all" || i.type === filter);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "email", "linkedin", "task", "stage_change", "note"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-2 py-1 text-xs ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            {f === "all" ? "All" : typeMeta[f as ActivityType].label}
          </button>
        ))}
      </div>

      {target && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(); }}
          className="mb-4 flex gap-2"
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={addNote.isPending || !note.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >Add</button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity to show.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const Meta = typeMeta[a.type] ?? typeMeta.note;
            const Icon = Meta.icon;
            const wonLost = a.type === "stage_change" && (a.subtype === "won" || a.subtype === "lost");
            return (
              <li
                key={a.id}
                className={`flex gap-3 rounded-md border bg-card p-3 ${
                  wonLost && a.subtype === "won"
                    ? "border-[color:var(--color-success)]/40"
                    : wonLost && a.subtype === "lost"
                    ? "border-destructive/40"
                    : "border-border"
                }`}
              >
                <div className="mt-0.5 text-muted-foreground">
                  {a.subtype === "won" ? <Trophy className="h-4 w-4 text-[color:var(--color-success)]" /> :
                   a.subtype === "lost" ? <XCircle className="h-4 w-4 text-destructive" /> :
                   <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{relTime(a.occurredAt)}</div>
                  </div>
                  {a.description && <div className="mt-0.5 text-xs text-muted-foreground">{a.description}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
