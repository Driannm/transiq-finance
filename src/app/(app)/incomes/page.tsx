// src/app/(app)/income/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
import { BalanceHeader } from "@/components/Shared/BalanceHeader";
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
  Calendar01Icon,
  Money02Icon,
  ArrowDownAZIcon,
  ViewIcon,
  Edit03Icon,
  Delete02Icon,
  MoneyReceive02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getIncomeSourceIcon } from "@/lib/iconMapping";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncomeItem {
  id: string;
  name: string;
  notes?: string | null;
  category?: { id: string; name: string } | null;
  source?: string | { id: string; name: string } | null;
  transaction: {
    id: string;
    amount: number;
    date: string;
    createdAt: string;
    card: { id: string; name: string; type: string };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeFormatDate(
  dateStr: string | null | undefined,
  fmt: string,
): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : "—";
}

// ─── Controls Config — di luar komponen ───────────────────────────────────────

const CONTROLS_CONFIG: DataControlsConfig = {
  search: {
    placeholder: "Cari pemasukan...",
    searchKeys: ["name"],
  },
  sort: {
    defaultValue: "transaction.date",
    fields: [
      { value: "transaction.date", label: "Tanggal", icon: Calendar01Icon },
      { value: "transaction.amount", label: "Jumlah", icon: Money02Icon },
      { value: "name", label: "Nama", icon: ArrowDownAZIcon },
    ],
  },
  view: { modes: ["list"], defaultMode: "list" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IncomePage() {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();

  const fetchIncomes = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetch(
          `/api/income?month=${month}&page=${isLoadMore ? page + 1 : 1}&limit=20`,
        );
        const data = await res.json();
        const newIncomes = Array.isArray(data.incomes) ? data.incomes : [];

        if (isLoadMore) {
          setIncomes((prev) => [...prev, ...newIncomes]);
          setPage((prev) => prev + 1);
        } else {
          setIncomes(newIncomes);
          setPage(1);
        }

        setHasMore(data.pagination?.hasMore ?? newIncomes.length === 20);
      } catch (error) {
        console.error("Failed to fetch incomes:", error);
        if (!isLoadMore) setIncomes([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [month, page],
  );

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

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

  const total = incomes.reduce((sum, i) => sum + i.transaction.amount, 0);

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const handleView = useCallback((id: string | number) => {
    window.location.href = `/incomes/${id}`;
  }, []);

  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/incomes/${id}/edit`;
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      await fetch(`/api/income/${id}`, { method: "DELETE" });
      setIncomes((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Failed to delete income:", error);
    }
  }, []);

  const controls = useDataControls<IncomeItem>(incomes, CONTROLS_CONFIG);

  const isSearchActive = controls.state.search.trim().length > 0;
  const isSortChanged = controls.state.sort.field !== "transaction.date";
  const isFlat = isSearchActive || isSortChanged;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      <div className="sticky top-0 z-50 bg-neutral-100 dark:bg-neutral-950">
        <IslandNavbar
          title="Income"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/dashboard")}
          actions={[
            {
              icon: (
                <Link href="/incomes/add">
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
        {/* ── Summary Card ── */}
        <BalanceHeader
          label="Total Pemasukan"
          amount={total}
          variant="green"
          isLoading={loading}
          monthSelector={{
            currentMonth: month,
            onPrev: prevMonth,
            onNext: nextMonth,
            style: "sleek",
          }}
          badges={[
            <div
              key="cnt"
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full"
            >
              <HugeiconsIcon
                icon={MoneyReceive02Icon}
                size={14}
                className="text-emerald-300"
              />
              <span className="text-xs font-mono font-medium text-white">
                {incomes.length} transaksi
              </span>
            </div>,
          ]}
        />

        {/* ── Controls ── */}
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

        {/* ── List ── */}
        <SectionBlock title="" padded={false}>
          <CardList<IncomeItem>
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
                    typeExtractor: () => "income",
                  }
            }
            keyExtractor={(i) => i.id}
            renderItem={(income) => ({
              left: (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <HugeiconsIcon
                      icon={getIncomeSourceIcon(
                        typeof income.source === "string"
                          ? income.source
                          : income.source?.name,
                      )}
                      size={22}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {income.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 capitalize">
                      {typeof income.source === "string"
                        ? income.source
                        : (income.source?.name ?? income.transaction.card.name)}
                    </p>
                  </div>
                </>
              ),
              right: `IDR ${formatIDR(income.transaction.amount)}`,
              meta: {
                date: safeFormatDate(income.transaction.date, "dd MMM yyyy"),
                amount: income.transaction.amount,
                type: "income" as const,
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
                  "Income akan dihapus permanen. Saldo kartu akan dikurangi.",
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
              title: "Belum ada pemasukan",
              description:
                "Catat pemasukan pertama kamu untuk mulai melacak keuangan.",
              actions: [
                {
                  id: "add-income",
                  label: "Catat Income",
                  onPress: () => (window.location.href = "/incomes/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchIncomes(true)}
            loadingMore={loadingMore}
            className="mt-3"
          />
        </SectionBlock>
      </div>
    </div>
  );
}
