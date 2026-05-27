"use client";

import Link from "next/link";
import { resolveIcon } from "@/components/Shared/IconPicker/IconPicker";
import { formatRupiah, calcProgress, daysUntil } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SavingGoal } from "@/types/saving.types";
import { HugeiconsIcon } from "@hugeicons/react";

// ─── color map ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; icon: string; badge: string }> = {
  emerald: {
    bg:    "bg-emerald-50 dark:bg-emerald-950/30",
    icon:  "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  blue: {
    bg:    "bg-blue-50 dark:bg-blue-950/30",
    icon:  "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  amber: {
    bg:    "bg-amber-50 dark:bg-amber-950/30",
    icon:  "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  purple: {
    bg:    "bg-purple-50 dark:bg-purple-950/30",
    icon:  "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  rose: {
    bg:    "bg-rose-50 dark:bg-rose-950/30",
    icon:  "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

const FALLBACK_COLOR = COLOR_MAP.emerald;

// ─── component ─────────────────────────────────────────────────────────────
type GoalCardProps = {
  goal: SavingGoal;
};

export function GoalCard({ goal }: GoalCardProps) {
  const Icon = resolveIcon(goal.iconId);
  const progress = calcProgress(goal.currentAmount, goal.targetAmount);
  const colors = COLOR_MAP[goal.color] ?? FALLBACK_COLOR;
  const isCompleted = progress >= 100;

  const daysLeft = goal.deadline ? daysUntil(goal.deadline) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 30 && !isCompleted;

  return (
    <Link
      href={`/saving/${goal.id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5",
        "transition-all duration-200 hover:border-border hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", colors.bg)}>
          {Icon && <HugeiconsIcon icon={Icon} size={22} strokeWidth={1.5} className={colors.icon} />} 
        </div>

        <div className="flex gap-1.5">
          {isCompleted && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
              Tercapai ✓
            </Badge>
          )}
          {isUrgent && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0">
              {daysLeft}h lagi
            </Badge>
          )}
          {!isCompleted && !isUrgent && daysLeft !== null && (
            <Badge variant="secondary">{daysLeft}h lagi</Badge>
          )}
        </div>
      </div>

      {/* info */}
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground leading-tight">{goal.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatRupiah(goal.currentAmount, true)}{" "}
          <span className="text-muted-foreground/60">dari</span>{" "}
          {formatRupiah(goal.targetAmount, true)}
        </p>
      </div>

      {/* progress */}
      <div className="space-y-1.5">
        <Progress
          value={progress}
          className="h-1.5"
        />
        <p className="text-xs text-muted-foreground text-right">{progress}%</p>
      </div>
    </Link>
  );
}
