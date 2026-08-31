// src/components/Expenses/ExpenseList/ExpenseGroupItem.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { getCategoryIcon } from "@/lib/iconMapping";
import { formatIDR } from "@/lib/format";
import { ExpenseGroupMeta, ExpenseRecord } from "./types";

// Icon type from @hugeicons/core-free-icons matches readonly tuple structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HugeIcon = any;
// ─── Checkbox ─────────────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExpenseGroupItemProps {
  group: ExpenseGroupMeta;
  expenses: ExpenseRecord[];
  totalAmount: number;
  isExpanded: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  resolveIcon: (iconName: string) => HugeIcon;
  onToggle: () => void;
  onChildPress: (expense: ExpenseRecord) => void;
  onChildSelect: (txId: string) => void;
  timeFormatter: (dateStr: string) => string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseGroupItem({
  group,
  expenses,
  totalAmount,
  isExpanded,
  selectMode,
  selectedIds,
  resolveIcon,
  onToggle,
  onChildPress,
  onChildSelect,
  timeFormatter,
}: ExpenseGroupItemProps) {
  const GroupIconComp = resolveIcon(group.icon);

  return (
    <div className="transition-all duration-200 bg-white dark:bg-neutral-900 border-b last:border-0 border-gray-200/40 dark:border-neutral-800/40">
      {/* ── Group Header Row ─────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/25 transition-colors select-none"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: group.iconColor + "15",
              color: group.iconColor,
            }}
          >
            <HugeiconsIcon icon={GroupIconComp} size={22} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 leading-tight">
              <span>{group.name}</span>
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md lowercase">
                {expenses.length} item
              </span>
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">
              Bungkusan Pengeluaran
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-3">
          <div className="text-right">
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              IDR {formatIDR(totalAmount)}
            </p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 tracking-wide uppercase font-bold mt-0.5">
              Total Grup
            </p>
          </div>
          <HugeiconsIcon
            icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
            size={16}
            className="text-gray-500 transition-transform ml-1"
          />
        </div>
      </div>

      {/* ── Collapsible Children ─────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
            className="overflow-hidden bg-neutral-50/70 dark:bg-neutral-950/40 border-t border-gray-200/40 dark:border-neutral-800/40 p-3.5 space-y-2"
          >
            {expenses.map((child) => {
              const checkId = child.transaction.id;
              const isChildSelected = selectedIds.has(checkId);
              return (
                <div
                  key={child.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectMode) onChildSelect(checkId);
                    else onChildPress(child);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (selectMode) onChildSelect(checkId);
                      else onChildPress(child);
                    }
                  }}
                  className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-all cursor-pointer bg-white dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800/70 select-none ${
                    isChildSelected
                      ? "ring-2 ring-blue-500 dark:ring-blue-600/75 shadow-xs"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {selectMode && (
                      <div
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onChildSelect(checkId);
                        }}
                      >
                        <Checkbox checked={isChildSelected} />
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0 border border-red-100/40 dark:border-red-900/35">
                      <HugeiconsIcon
                        icon={getCategoryIcon(child.category?.name)}
                        size={16}
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {child.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {child.transaction.card.name}&nbsp;&middot;&nbsp;
                        {timeFormatter(child.transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3">
                    <span className="text-xs font-bold text-gray-905 dark:text-gray-300 select-none block">
                      IDR {formatIDR(child.transaction.amount)}
                    </span>
                    {child.discount > 0 ||
                    (child.tax ?? 0) + (child.fee ?? 0) > 0 ? (
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[9px] leading-none select-none flex-wrap">
                        {child.discount > 0 && (
                          <span className="text-emerald-600/70 dark:text-emerald-500/60 font-semibold font-mono whitespace-nowrap">
                            - IDR {formatIDR(child.discount)}
                          </span>
                        )}
                        {(child.tax ?? 0) + (child.fee ?? 0) > 0 && (
                          <span className="text-orange-600/70 dark:text-orange-500/60 font-semibold font-mono whitespace-nowrap">
                            + IDR{" "}
                            {formatIDR((child.tax ?? 0) + (child.fee ?? 0))}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
