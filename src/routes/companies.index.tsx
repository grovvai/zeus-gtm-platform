import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { companiesApi } from "@/api/client";
import { LoadError } from "@/components/common/LoadError";
import { Search } from "lucide-react";

export const Route = createFileRoute("/companies/")({
  head: () => ({ meta: [{ title: "Companies — Zeus" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["companies", q, page],
    queryFn: () => companiesApi.list({ q, page, pageSize: 25 }),
    retry: false,
  });

  return (
    <AppShell title="Companies">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search companies…"
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
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium">Industry</th>
                <th className="px-3 py-2 font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {list.data.data.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-3 py-2 font-medium">
                    <Link to="/companies/$id" params={{ id: c.id }} className="hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.domain ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.industry ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.size ?? "—"}</td>
                </tr>
              ))}
              {list.data.data.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">No companies.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
