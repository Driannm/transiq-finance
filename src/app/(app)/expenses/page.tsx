// src/app/expenses/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
import { EmptyState } from "@/components/Shared/EmptyState";
import {
  Add01Icon,
  ArrowLeft02Icon,
  Invoice02Icon,
  Edit01Icon,
  Delete01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getCategoryIcon } from "@/lib/iconMapping";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";

// ─── Types ───────────────────────────────────────────────────

interface ExpenseItem {
  id: string;
  name: string;
  tax: number;
  fee: number;
  discount: number;
  notes?: string | null;
  category?: { id: string; name: string } | null;
  merchant?: { id: string; name: string } | null;
  transaction: {
    id: string;
    amount: number;
    date: string;
    createdAt: string;
    card: { id: string; name: string; type: string };
  };
}

// ─── Helpers ────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeFormatDate(
  dateStr: string | null | undefined,
  fmt: string
): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
}

// ─── Page Component ─────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchExpenses = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/expenses?month=${month}&page=${
            isLoadMore ? page + 1 : 1
          }&limit=20`
        );
        const data = await res.json();

        const newExpenses = Array.isArray(data.expenses) ? data.expenses : [];

        if (isLoadMore) {
          setExpenses((prev) => [...prev, ...newExpenses]);
          setPage((prev) => prev + 1);
        } else {
          setExpenses(newExpenses);
          setPage(1);
        }

        setHasMore(data.hasMore ?? newExpenses.length === 20);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        if (!isLoadMore) setExpenses([]);
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [month, page]
  );

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const prevMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() - 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const nextMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() + 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const total = expenses.reduce((sum, e) => sum + e.transaction.amount, 0);
  const totalDiscount = expenses.reduce((sum, e) => sum + (e.discount ?? 0), 0);

  const biggestExpense =
    expenses.length > 0
      ? expenses.reduce((max, e) =>
          e.transaction.amount > max.transaction.amount ? e : max
        )
      : null;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.length > 1
        ? window.history.back()
        : (window.location.href = "/");
    }
  };

  // Swipe actions handlers
  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/expenses/${id}/edit`;
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }, []);

  const handleView = useCallback((id: string | number) => {
    window.location.href = `/expenses/${id}`;
  }, [])

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      <IslandNavbar
        title="Expenses"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={handleBack}
        actions={[
          {
            icon: (
              <Link href="/expenses/add">
                <HugeiconsIcon icon={Add01Icon} size={18} />
              </Link>
            ),
            onPress: () => {},
            label: "Add",
          },
        ]}
      />

      <div className="px-4 pt-4 space-y-5">
        {/* ── Expense Summary Card ── */}
        <div className="bg-white dark:bg-neutral-900 rounded-[18px] border border-gray-100 dark:border-gray-800 p-4">
          {/* Month selector */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400">Periode</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {safeFormatDate(month + "-01", "MMMM yyyy")}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-neutral-800 flex items-center justify-center text-gray-500 text-sm"
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-neutral-800 flex items-center justify-center text-gray-500 text-sm"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

          {/* Total */}
          <p className="text-[11px] text-gray-400 mb-1">Total pengeluaran</p>
          <p className="text-[26px] font-semibold text-red-500 leading-none font-mono">
            IDR {formatIDR(total)}
          </p>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Hemat dari diskon */}
            <div className="bg-green-50 dark:bg-green-950/40 rounded-[10px] p-3">
              <p className="text-[10px] text-green-700 dark:text-green-400 mb-1">
                Hemat bulan ini
              </p>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                IDR {formatIDR(totalDiscount)}
              </p>
            </div>

            {/* Pengeluaran terbanyak */}
            <div className="bg-red-50 dark:bg-red-950/40 rounded-[10px] p-3">
              <p className="text-[10px] text-red-400 dark:text-red-400 mb-1">
                Terbesar bulan ini
              </p>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 truncate">
                {biggestExpense
                  ? `IDR ${formatIDR(biggestExpense.transaction.amount)}`
                  : "—"}
              </p>
              {biggestExpense && (
                <p className="text-[10px] text-red-400 dark:text-red-500 truncate mt-0.5">
                  {biggestExpense.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Expenses List with Enhanced CardList ── */}
        <SectionBlock title="Semua Expenses" padded={false}>
          <CardList<ExpenseItem>
            items={expenses}
            layout="detailed"
            enableSwipe={true}
            grouping={{
              enabled: true,
              groupBy: (item) => getRelativeDateLabel(item.transaction.date),
              showSubtotal: true,
              subtotalFormatter: (amount) =>
                `IDR ${formatIDR(Math.abs(amount))}`,
            }}
            keyExtractor={(e) => e.id}
            renderItem={(expense) => ({
              left: (
                <>
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <HugeiconsIcon
                      icon={getCategoryIcon(expense.category?.name)}
                      size={22}
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {expense.name}
                    </p>
                    {expense.transaction?.card && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {expense.transaction.card.name}
                      </p>
                    )}
                  </div>
                </>
              ),
              right: `IDR ${formatIDR(expense.transaction.amount)}`,
              meta: {
                date: safeFormatDate(expense.transaction.date, "dd MMM yyyy"),
                amount: expense.transaction.amount,
                type: "expense" as const,
              },
            })}
            swipeActions={[
              {
                id: "view",
                label: "Detail",
                variant: "primary",
                icon: <HugeiconsIcon icon={EyeIcon} size={18} />,
                onExecute: handleView,
                position: "left",
              },
              {
                id: "edit",
                label: "Edit",
                variant: "primary",
                icon: <HugeiconsIcon icon={Edit01Icon} size={18} />,
                onExecute: handleEdit,
              },
              {
                id: "delete",
                label: "Hapus",
                variant: "danger",
                icon: <HugeiconsIcon icon={Delete01Icon} size={18} />,
                onExecute: handleDelete,
                requiresConfirm: true,
                confirmMessage:
                  "Expense akan dihapus permanen. Data tidak dapat dikembalikan.",
              },
            ]}
            isLoading={loading}
            skeleton={{
              fields: ["icon", "title", "subtitle", "amount", "date"],
              count: 5,
            }}
            emptyState={{
              icon: (
                <HugeiconsIcon
                  icon={Invoice02Icon}
                  size={32}
                  className="text-gray-300 dark:text-gray-600"
                />
              ),
              title: "Belum ada pengeluaran",
              description:
                "Catat pengeluaran pertama kamu untuk mulai melacak keuangan.",
              actions: [
                {
                  id: "add-expense",
                  label: "Catat Expense",
                  onPress: () => (window.location.href = "/expenses/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchExpenses(true)}
            loadingMore={loadingMore}
            enableVirtualization={expenses.length > 50}
            itemHeight={96} // Increased height untuk detailed layout
            className="mt-3" // Added margin top
          />
        </SectionBlock>
      </div>
    </div>
  );
}
