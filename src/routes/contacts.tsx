import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { contactsApi, aiApi } from "@/api/client";
import { LoadError } from "@/components/common/LoadError";
import { TierBadge } from "@/components/common/TierBadge";
import { Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import type { AiScoreResponse } from "@/types";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Zeus" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["contacts", q, page],
    queryFn: () => contactsApi.list({ q, page, pageSize: 25 }),
    retry: false,
  });

  const [scores, setScores] = useState<Record<string, AiScoreResponse>>({});
  const score = useMutation({
    mutationFn: (contactId: string) => aiApi.score({ contactId }),
    onSuccess: (data, contactId) => {
      setScores((prev) => ({ ...prev, [contactId]: data }));
      toast.success(`Scored: ${data.score} (${data.tier})`);
    },
    onError: (e) => toast.error(`Scoring failed: ${(e as Error).message}`),
  });

  return (
    <AppShell title="Contacts">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search contacts…"
            className="w-full rounded-md border border-border bg-card py-1.5 pl-7 pr-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {list.isError && <LoadError error={list.error} />}
      {list.data && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">AI Score</th>
              </tr>
            </thead>
            <tbody>
              {list.data.data.map((c) => {
                const s = scores[c.id];
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                    <td className="px-3 py-2 font-medium">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.title ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.company?.id ? (
                        <Link to="/companies/$id" params={{ id: c.company.id }} className="hover:underline">
                          {c.company.name}
                        </Link>
                      ) : (c.company?.name ?? "—")}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      {s ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.score}</span>
                          <TierBadge tier={s.tier} />
                        </div>
                      ) : (
                        <button
                          onClick={() => score.mutate(c.id)}
                          disabled={score.isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:border-primary"
                        >
                          <Sparkles className="h-3 w-3" /> Score
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.data.data.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">No contacts.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {list.data && list.data.total > list.data.pageSize && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {list.data.page} of {Math.ceil(list.data.total / list.data.pageSize)}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-border px-2 py-1 hover:border-primary">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-2 py-1 hover:border-primary">Next</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
