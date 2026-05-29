import type { Tier } from "@/types";
import { cn } from "@/lib/utils";

const map: Record<Tier, string> = {
  hot: "bg-[color:var(--color-tier-hot)]/15 text-[color:var(--color-tier-hot)] border-[color:var(--color-tier-hot)]/30",
  warm: "bg-[color:var(--color-tier-warm)]/15 text-[color:var(--color-tier-warm)] border-[color:var(--color-tier-warm)]/30",
  cool: "bg-[color:var(--color-tier-cool)]/15 text-[color:var(--color-tier-cool)] border-[color:var(--color-tier-cool)]/30",
  cold: "bg-[color:var(--color-tier-cold)]/15 text-[color:var(--color-tier-cold)] border-[color:var(--color-tier-cold)]/30",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        map[tier],
      )}
    >
      {tier}
    </span>
  );
}
