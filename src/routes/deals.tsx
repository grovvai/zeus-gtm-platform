import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { AppShell } from "@/components/layout/AppShell";
import { dealsApi } from "@/api/client";
import type { BoardStage, Deal, DealBoard } from "@/types";
import { fmtMoney } from "@/lib/format";
import { LoadError } from "@/components/common/LoadError";
import { toast } from "sonner";

export const Route = createFileRoute("/deals")({
  head: () => ({ meta: [{ title: "Deals — Zeus" }] }),
  component: DealsPage,
});

function DealsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deals", "board"],
    queryFn: () => dealsApi.board(),
    retry: false,
  });

  const [board, setBoard] = useState<DealBoard | null>(null);
  useEffect(() => { if (data) setBoard(data); }, [data]);

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const move = useMutation({
    mutationFn: (v: { id: string; stageId: string; position: number }) =>
      dealsApi.move(v.id, { stageId: v.stageId, position: v.position }),
    onError: (e) => {
      toast.error(`Move failed: ${(e as Error).message}`);
      qc.invalidateQueries({ queryKey: ["deals", "board"] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals", "board"] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const dealById = useMemo(() => {
    const m = new Map<string, { deal: Deal; stageId: string }>();
    board?.stages.forEach((s) => s.deals.forEach((d) => m.set(d.id, { deal: d, stageId: s.id })));
    return m;
  }, [board]);

  function onDragStart(e: DragStartEvent) {
    const entry = dealById.get(String(e.active.id));
    if (entry) setActiveDeal(entry.deal);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    if (!board || !e.over) return;
    const dealId = String(e.active.id);
    const overId = String(e.over.id);
    const src = dealById.get(dealId);
    if (!src) return;

    // overId is either a stage id ("stage:<id>") or deal id
    let destStageId = src.stageId;
    let destIndex = 0;
    if (overId.startsWith("stage:")) {
      destStageId = overId.slice(6);
      destIndex = (board.stages.find((s) => s.id === destStageId)?.deals.length ?? 0);
    } else {
      const dest = dealById.get(overId);
      if (!dest) return;
      destStageId = dest.stageId;
      const stageDeals = board.stages.find((s) => s.id === destStageId)!.deals;
      destIndex = stageDeals.findIndex((d) => d.id === overId);
    }

    // Optimistic update
    const next: DealBoard = {
      ...board,
      stages: board.stages.map((s) => ({ ...s, deals: s.deals.filter((d) => d.id !== dealId) })),
    };
    const destStage = next.stages.find((s) => s.id === destStageId);
    if (!destStage) return;
    destStage.deals.splice(destIndex, 0, { ...src.deal, stageId: destStageId, position: destIndex });
    next.stages = next.stages.map((s) => ({ ...s, total: s.deals.reduce((sum, d) => sum + (d.amount || 0), 0) }));
    setBoard(next);

    move.mutate({ id: dealId, stageId: destStageId, position: destIndex });
  }

  return (
    <AppShell title="Deals">
      {isError && <LoadError error={error} />}
      {isLoading && <div className="text-sm text-muted-foreground">Loading board…</div>}
      {board && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {board.stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} />
            ))}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} dragging />}</DragOverlay>
        </DndContext>
      )}
    </AppShell>
  );
}

function StageColumn({ stage }: { stage: BoardStage }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card/60 ${isOver ? "ring-1 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{stage.name}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{stage.deals.length}</span>
        </div>
        <span className="text-xs text-muted-foreground">{fmtMoney(stage.total)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {stage.deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
        {stage.deals.length === 0 && (
          <div className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, dragging }: { deal: Deal; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-border bg-card p-3 text-sm shadow-sm transition ${isDragging || dragging ? "opacity-60" : "hover:border-primary/60"}`}
    >
      <div className="font-medium leading-tight">{deal.name}</div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{fmtMoney(deal.amount, deal.currency)}</span>
        {typeof deal.probability === "number" && <span>{deal.probability}%</span>}
      </div>
      {(deal.contact || deal.company) && (
        <div className="mt-2 truncate text-xs text-muted-foreground">
          {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : ""}
          {deal.contact && deal.company ? " · " : ""}
          {deal.company?.name ?? ""}
        </div>
      )}
    </div>
  );
}
