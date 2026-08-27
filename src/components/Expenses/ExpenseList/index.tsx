// src/components/Expenses/ExpenseList/index.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice02Icon } from "@hugeicons/core-free-icons";
import { ExpenseSkeleton } from "./ExpenseSkeleton";
import { ExpenseItem } from "./ExpenseItem";
import { ExpenseGroupItem } from "./ExpenseGroupItem";
import { SwipeAction } from "@/components/Shared/CardList/types";
import { ExpenseDisplayItem, ExpenseDateGroup, ExpenseRecord } from "./types";
import { format, isValid } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeTime(dateStr: string): string {
  const d = new Date(dateStr);
  return isValid(d) ? format(d, "HH:mm") : "—";
}

// ─── Load More Button ─────────────────────────────────────────────────────────

function LoadMoreButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onPress}
        disabled={loading}
        className="px-5 py-2.5 rounded-full text-xs font-bold bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 active:scale-95 transition-all text-gray-700 dark:text-gray-300 disabled:opacity-50"
      >
        {loading ? "Memuat..." : "Muat Lebih Banyak"}
      </button>
    </div>
  );
}

// ─── Date Group Header ────────────────────────────────────────────────────────

function DateGroupHeader({ label, total }: { label: string; total: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
        {label}
      </h3>
      <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-500">
        IDR {formatIDR(total)}
      </span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyExpenses() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200/40 dark:border-neutral-800/40 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-neutral-950 flex items-center justify-center text-gray-400 dark:text-gray-600 mb-3 border border-gray-100 dark:border-neutral-900">
        <HugeiconsIcon icon={Invoice02Icon} size={24} />
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
        Belum ada pengeluaran
      </h3>
      <p className="text-xs text-gray-500 max-w-[240px] mt-1">
        Catat pengeluaran pertama kamu untuk mulai melacak keuangan.
      </p>
    </div>
  );
}

// ─── List Container ───────────────────────────────────────────────────────────

const LIST_CLASS =
  "bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200/40 dark:border-neutral-800/40 shadow-sm overflow-hidden divide-y divide-gray-100/60 dark:divide-neutral-800/50";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExpenseListProps {
  /** Flat list — used when search/sort is active */
  flatItems: ExpenseDisplayItem[];
  /** Date-grouped list — used in default view */
  groupedItems: ExpenseDateGroup[];
  /** When true, renders flatItems instead of groupedItems */
  isFlat: boolean;

  isLoading: boolean;
  hasMore: boolean;
  loadingMore: boolean;

  selectMode: boolean;
  selectedIds: Set<string>;
  expandedGroupIds: Set<string>;

  swipeActions: SwipeAction[];

  onLoadMore: () => void;
  onExpensePress: (expense: ExpenseRecord) => void;
  onSelectToggle: (txId: string) => void;
  onGroupToggle: (groupId: string) => void;

  /** Resolves icon name string → Hugeicons icon component. Pass from page to avoid coupling. */
  resolveGroupIcon: (iconName: string) => React.ComponentType | object;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseList({
  flatItems,
  groupedItems,
  isFlat,
  isLoading,
  hasMore,
  loadingMore,
  selectMode,
  selectedIds,
  expandedGroupIds,
  swipeActions,
  onLoadMore,
  onExpensePress,
  onSelectToggle,
  onGroupToggle,
  resolveGroupIcon,
}: ExpenseListProps) {
  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return <ExpenseSkeleton count={5} />;
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  const isEmpty = isFlat ? flatItems.length === 0 : groupedItems.length === 0;
  if (isEmpty) {
    return <EmptyExpenses />;
  }

  // ── Render item helper ───────────────────────────────────────────────────
  const renderItem = (item: ExpenseDisplayItem) => {
    if (item.isGroup) {
      return (
        <ExpenseGroupItem
          key={item.id}
          group={item.group}
          expenses={item.expenses}
          totalAmount={item.transaction.amount}
          isExpanded={expandedGroupIds.has(item.group.id)}
          selectMode={selectMode}
          selectedIds={selectedIds}
          resolveIcon={resolveGroupIcon}
          onToggle={() => onGroupToggle(item.group.id)}
          onChildPress={onExpensePress}
          onChildSelect={onSelectToggle}
          timeFormatter={safeTime}
        />
      );
    }

    return (
      <ExpenseItem
        key={item.id}
        itemId={item.id}
        expense={item.expense}
        selectMode={selectMode}
        isSelected={selectedIds.has(item.expense.transaction.id)}
        swipeActions={swipeActions}
        onPress={() => onExpensePress(item.expense)}
        onSelect={onSelectToggle}
        timeLabel={safeTime(item.transaction.date)}
      />
    );
  };

  // ── Flat render (search / sort active) ──────────────────────────────────
  if (isFlat) {
    return (
      <>
        <div className={LIST_CLASS}>{flatItems.map(renderItem)}</div>
        {hasMore && (
          <LoadMoreButton loading={loadingMore} onPress={onLoadMore} />
        )}
      </>
    );
  }

  // ── Grouped render (default — grouped by date) ───────────────────────────
  return (
    <>
      <div className="space-y-6">
        {groupedItems.map((group) => (
          <div key={group.key} className="space-y-2">
            <DateGroupHeader label={group.key} total={group.total} />
            <div className={LIST_CLASS}>{group.items.map(renderItem)}</div>
          </div>
        ))}
      </div>
      {hasMore && <LoadMoreButton loading={loadingMore} onPress={onLoadMore} />}
    </>
  );
}
