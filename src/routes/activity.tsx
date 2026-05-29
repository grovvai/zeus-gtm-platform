import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { activityApi } from "@/api/client";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity — Zeus" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const feed = useQuery({ queryKey: ["activity", "global"], queryFn: () => activityApi.feed(), retry: false });
  return (
    <AppShell title="Activity">
      <div className="rounded-lg border border-border bg-card p-4">
        <ActivityFeed query={feed} />
      </div>
    </AppShell>
  );
}
