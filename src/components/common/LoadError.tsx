export function LoadError({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
      <div className="font-medium">Failed to load</div>
      <div className="mt-1 text-xs opacity-90">{msg}</div>
      <div className="mt-2 text-xs opacity-70">
        Ensure the Zeus backend is running at the configured base URL (default{" "}
        <code className="rounded bg-background/50 px-1">http://localhost:3001</code>).
      </div>
    </div>
  );
}
