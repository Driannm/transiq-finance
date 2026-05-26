/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/expenses/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { useRouter } from "next/navigation";
import {
  DataControlsBar,
  useDataControls,
  type DataControlsConfig,
} from "@/components/Shared/DataControls";
import {
  Add01Icon,
  ArrowLeft02Icon,
  Invoice02Icon,
  AddCircleIcon,
  Calendar01Icon,
  Money02Icon,
  ArrowDownAZIcon,
  ViewIcon,
  Edit03Icon,
  Delete02Icon,
  TextFontIcon,
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

  const router = useRouter();

  const CONTROLS_CONFIG: DataControlsConfig = {
    // TODO : fix search because its need 2 clicks to search, first click is showing the placeholder, second click is searching

    search: {
      placeholder: "Cari pengeluaran...",
      searchKeys: ["name"],
    },
    sort: {
      // TODO : Change defaultValue to date descending or delete the defaultValue
      defaultValue: "transaction.date",
      fields: [
        { value: "transaction.date", label: "Tanggal", icon: Calendar01Icon },
        { value: "transaction.amount", label: "Jumlah", icon: Money02Icon },
        { value: "name", label: "Nama", icon: TextFontIcon },
      ],
    },
    view: { modes: ["list"], defaultMode: "list" },
  };

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

  const handleBack = () => {
    router.push("/dashboard");
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
  }, []);

  const controls = useDataControls<ExpenseItem>(expenses, CONTROLS_CONFIG);

  const isSearchActive = controls.state.search.trim().length > 0;
  const isSortActive = controls.state.sort.field !== "transaction.date";
  const isFlat = isSearchActive || isSortActive;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      <div className="sticky top-0 z-50">
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
      </div>
      <div className="px-4 pt-4 space-y-5">
        {/* ── Expense Summary Card with Inline Month Selector ── */}
        <div
          className="relative overflow-hidden rounded-[24px] p-6 text-white"
          style={{
            background: `
      radial-gradient(circle at top right, rgba(220, 38, 38, 0.95) 0%, rgba(220, 38, 38, 0.35) 18%, transparent 42%),
      radial-gradient(circle at bottom right, rgba(185, 28, 28, 0.85) 0%, rgba(185, 28, 28, 0.22) 20%, transparent 45%),
      linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)
    `,
            boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.20),
      inset -1px 0 0 rgba(220, 38, 38, 0.12),
      0 10px 30px rgba(0,0,0,0.45)
    `,
          }}
        >
          <div className="relative z-10 flex flex-col gap-3.5">
            {/* Baris Atas: Label & Month Selector Terintegrasi */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50">
                Total pengeluaran
              </p>

              {/* Month Selector Minimalis (Glassmorphism Pill) */}
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full select-none">
                <button
                  onClick={prevMonth}
                  className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold"
                >
                  ‹
                </button>
                <span className="text-[11px] md:text-xs font-semibold tracking-wide text-white whitespace-nowrap">
                  {safeFormatDate(month + "-01", "MMMM yyyy")}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Baris Tengah: Nominal Pengeluaran */}
            <div>
              <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none">
                IDR {formatIDR(total)}
              </h2>
            </div>

            {/* Baris Bawah: Badges */}
            <div className="flex items-center gap-2">
              {/* Badge Hemat */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-red-200">
                  <HugeiconsIcon icon={AddCircleIcon} size={16} />
                </span>
                <span className="text-xs font-mono font-medium text-white">
                  230.000
                </span>
              </div>

              {/* Badge Persentase */}
              <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-3 py-1.5 rounded-full text-green-300">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <span className="text-xs font-semibold">12.5%</span>
              </div>
            </div>
          </div>
        </div>

        <DataControlsBar
          config={CONTROLS_CONFIG}
          state={controls.state}
          activeFilterCount={controls.activeFilterCount}
          onSearchChange={controls.setSearch}
          onSortChange={controls.setSort}
          onFilterChange={controls.setFilter}
          onFiltersChange={controls.setFilters}
          onFiltersReset={controls.resetFilters}
          onViewChange={controls.setView}
          onGroupChange={controls.setGroup}
        />

        {/* ── Expenses List with Enhanced CardList ── */}
        <SectionBlock title="Semua Expenses" padded={false}>
          <CardList<ExpenseItem>
            items={controls.data}
            layout="detailed"
            enableSwipe={true}
            grouping={
              isFlat
                ? undefined
                : {
                    enabled: true,
                    groupBy: (item) =>
                      getRelativeDateLabel(item.transaction.date),
                    showSubtotal: true,
                    subtotalFormatter: (amount) =>
                      `IDR ${formatIDR(Math.abs(amount))}`,
                    amountExtractor: (item) => item.transaction.amount,
                    typeExtractor: () => "expense",
                  }
            }
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
                icon: <HugeiconsIcon icon={ViewIcon} size={18} />,
                onExecute: handleView,
                position: "left",
              },
              {
                id: "edit",
                label: "Edit",
                variant: "primary",
                icon: <HugeiconsIcon icon={Edit03Icon} size={18} />,
                onExecute: handleEdit,
              },
              {
                id: "delete",
                label: "Hapus",
                variant: "danger",
                icon: <HugeiconsIcon icon={Delete02Icon} size={18} />,
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
