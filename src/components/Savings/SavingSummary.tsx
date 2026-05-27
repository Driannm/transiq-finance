"use client";

import { formatRupiah } from "@/lib/format";
import type { SavingGoal } from "@/types/saving.types";

type SavingSummaryProps = {
  goals: SavingGoal[];
};

export function SavingSummary({ goals }: SavingSummaryProps) {
  const totalTarget  = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved   = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const overallProgress = totalTarget > 0
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0;

  const stats = [
    { label: "Total Tabungan",  value: formatRupiah(totalSaved, true),      sub: `dari ${formatRupiah(totalTarget, true)}` },
    { label: "Goals Aktif",     value: `${goals.length}`,                   sub: `${completedCount} tercapai` },
    { label: "Progress Rata-rata", value: `${overallProgress}%`,            sub: "dari semua goals" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, sub }) => (
        <div
          key={label}
          className="rounded-2xl bg-muted/40 border border-border/40 px-4 py-3 space-y-0.5"
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground/70">{sub}</p>
        </div>
      ))}
    </div>
  );
}
