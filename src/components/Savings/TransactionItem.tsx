"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { formatRupiah, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/saving.types";
import { HugeiconsIcon } from "@hugeicons/react";

type TransactionItemProps = {
  transaction: Transaction;
  goalName?: string; // optional — show if rendering across goals
};

export function TransactionItem({
  transaction,
  goalName,
}: TransactionItemProps) {
  const isDeposit = transaction.type === "deposit";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      {/* icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isDeposit
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : "bg-red-100 dark:bg-red-900/30"
        )}
      >
        {isDeposit ? (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            strokeWidth={2}
            className="text-emerald-600 dark:text-emerald-400"
          />
        ) : (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            strokeWidth={2}
            className="text-red-600 dark:text-red-400"
          />
        )}
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {transaction.note || (isDeposit ? "Setor dana" : "Tarik dana")}
        </p>
        <p className="text-xs text-muted-foreground">
          {goalName ? `${goalName} · ` : ""}
          {formatDate(transaction.date)}
        </p>
      </div>

      {/* amount */}
      <p
        className={cn(
          "text-sm font-semibold tabular-nums shrink-0",
          isDeposit
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
        )}
      >
        {isDeposit ? "+" : "-"}
        {formatRupiah(transaction.amount, true)}
      </p>
    </div>
  );
}
