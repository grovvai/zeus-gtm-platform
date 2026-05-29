import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { crmSyncApi } from "@/api/client";
import { LoadError } from "@/components/common/LoadError";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { Download, Upload, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings & Integrations — Zeus" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["crm", "status"], queryFn: () => crmSyncApi.status(), retry: false });

  const pull = useMutation({
    mutationFn: (p: string) => crmSyncApi.pull(p),
    onSuccess: () => { toast.success("Pull started"); qc.invalidateQueries({ queryKey: ["crm"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const push = useMutation({
    mutationFn: ({ provider, entity }: { provider: string; entity: string }) => crmSyncApi.push(provider, entity),
    onSuccess: () => toast.success("Push started"),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <AppShell title="Settings & Integrations">
      <section className="rounded-lg border border-border bg-card p-4">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">CRM Sync</h2>
            <p className="text-xs text-muted-foreground">Connected providers, last sync time, and manual triggers.</p>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["crm"] })}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
          ><RefreshCw className="h-3 w-3" /> Refresh</button>
        </header>

        {status.isError && <LoadError error={status.error} />}
        {status.data && (
          status.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No CRM providers configured.</p>
          ) : (
            <ul className="divide-y divide-border">
              {status.data.map((s) => (
                <li key={s.provider} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium capitalize">
                      {s.provider}
                      <span className={`h-2 w-2 rounded-full ${s.connected ? "bg-[color:var(--color-success)]" : "bg-muted-foreground"}`} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last sync: {fmtDateTime(s.lastSyncAt)}
                      {s.lastError && <span className="ml-2 text-destructive">· {s.lastError}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => pull.mutate(s.provider)}
                      disabled={pull.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
                    ><Download className="h-3 w-3" /> Pull</button>
                    <button
                      onClick={() => push.mutate({ provider: s.provider, entity: "contacts" })}
                      disabled={push.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
                    ><Upload className="h-3 w-3" /> Push contacts</button>
                    <button
                      onClick={() => push.mutate({ provider: s.provider, entity: "companies" })}
                      disabled={push.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
                    ><Upload className="h-3 w-3" /> Push companies</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      <section className="mt-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">API endpoint</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Zeus frontend points at the backend base URL configured via{" "}
          <code className="rounded bg-background/50 px-1">VITE_API_BASE</code>.
          Default: <code className="rounded bg-background/50 px-1">http://localhost:3001</code>.
        </p>
      </section>
    </AppShell>
  );
}
