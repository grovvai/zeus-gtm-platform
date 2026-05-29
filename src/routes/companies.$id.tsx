import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { companiesApi, contactsApi, activityApi } from "@/api/client";
import { LoadError } from "@/components/common/LoadError";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/companies/$id")({
  head: () => ({ meta: [{ title: "Company — Zeus" }] }),
  component: CompanyDetail,
});

function CompanyDetail() {
  const { id } = Route.useParams();
  const company = useQuery({ queryKey: ["company", id], queryFn: () => companiesApi.get(id), retry: false });
  const contacts = useQuery({ queryKey: ["contacts", "co", id], queryFn: () => contactsApi.list({ companyId: id, pageSize: 50 }), retry: false });
  const feed = useQuery({ queryKey: ["activity", "co", id], queryFn: () => activityApi.feed({ companyId: id }), retry: false });

  return (
    <AppShell title={company.data?.name ?? "Company"}>
      {company.isError && <LoadError error={company.error} />}
      {company.data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-border bg-card p-4 lg:col-span-1">
            <h2 className="text-sm font-medium">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Domain" value={company.data.domain ?? "—"} />
              <Row label="Industry" value={company.data.industry ?? "—"} />
              <Row label="Size" value={company.data.size ?? "—"} />
              <Row label="Created" value={fmtDate(company.data.createdAt)} />
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <h2 className="text-sm font-medium">Contacts</h2>
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {contacts.data?.data.map((c) => (
                    <tr key={c.id} className="border-t border-border first:border-0">
                      <td className="px-3 py-2 font-medium">{c.firstName} {c.lastName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.title ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.email ?? "—"}</td>
                    </tr>
                  ))}
                  {!contacts.data?.data.length && (
                    <tr><td className="px-3 py-6 text-center text-xs text-muted-foreground">No contacts linked.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 lg:col-span-3">
            <h2 className="mb-3 text-sm font-medium">Activity</h2>
            <ActivityFeed query={feed} target={{ companyId: id }} />
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </div>
  );
}
