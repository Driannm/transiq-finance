// src/components/Expenses/ExpenseList/ExpenseItem.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { SwipeableCard } from "@/components/Shared/CardList/SwipeActions";
import { SwipeAction } from "@/components/Shared/CardList/types";
import { getCategoryIcon } from "@/lib/iconMapping";
import { ExpenseRecord } from "./types";

import { formatIDR } from "@/lib/format";

// ─── Checkbox ──────────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
        checked
          ? "bg-blue-500 border-blue-600 text-white"
          : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-transparent"
      }`}
    >
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        size={12}
        className="text-white"
      />
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface ExpenseItemProps {
  itemId: string; // composite id like "expense-{id}"
  expense: ExpenseRecord;
  selectMode: boolean;
  isSelected: boolean;
  swipeActions: SwipeAction[];
  onPress: () => void;
  onSelect: (txId: string) => void;
  timeLabel: string; // pre-formatted time string
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ExpenseItem({
  itemId,
  expense,
  selectMode,
  isSelected,
  swipeActions,
  onPress,
  onSelect,
  timeLabel,
}: ExpenseItemProps) {
  const txId = expense.transaction.id;

  const content = (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => {
        if (selectMode) onSelect(txId);
        else onPress();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (selectMode) onSelect(txId);
          else onPress();
        }
      }}
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/35 transition-colors cursor-pointer border-b last:border-0 border-gray-200/40 dark:border-neutral-800/40 select-none ${
        isSelected ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
      }`}
    >
      {/* Left */}
      <div className="flex items-center gap-4 min-w-0">
        {selectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(txId);
            }}
          >
            <Checkbox checked={isSelected} />
          </div>
        )}
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <HugeiconsIcon
            icon={getCategoryIcon(expense.category?.name)}
            size={22}
            className="text-red-600 dark:text-red-400"
          />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {expense.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {expense.transaction.card && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {expense.transaction.card.name}
              </span>
            )}
            {expense.transaction.groups?.[0]?.group && (
              <>
                <span className="text-gray-300 dark:text-neutral-700 text-[10px] select-none">
                  &middot;
                </span>
                <span
                  style={{
                    color: expense.transaction.groups[0].group.iconColor,
                  }}
                  className="text-[10px] font-semibold tracking-wide uppercase"
                >
                  {expense.transaction.groups[0].group.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="text-right flex-shrink-0 pl-3">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-300">
          IDR {formatIDR(expense.transaction.amount)}
        </p>
        {expense.discount > 0 || (expense.tax ?? 0) + (expense.fee ?? 0) > 0 ? (
          <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[10px] leading-none flex-wrap">
            {expense.discount > 0 && (
              <span className="text-emerald-600/70 dark:text-emerald-500/60 font-medium font-mono whitespace-nowrap">
                - IDR {formatIDR(expense.discount)}
              </span>
            )}
            {(expense.tax ?? 0) + (expense.fee ?? 0) > 0 && (
              <span className="text-orange-600/70 dark:text-orange-500/60 font-medium font-mono whitespace-nowrap">
                + IDR {formatIDR((expense.tax ?? 0) + (expense.fee ?? 0))}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            {timeLabel}
          </p>
        )}
      </div>
    </div>
  );

  if (selectMode) {
    return <div key={itemId}>{content}</div>;
  }

  return (
    <SwipeableCard key={itemId} actions={swipeActions} itemId={expense.id}>
      {content}
    </SwipeableCard>
  );
}
