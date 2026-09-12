/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/bills/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
import { BalanceHeader } from "@/components/Shared/BalanceHeader";
import {
  StatusFilterPills,
  type FilterOption,
} from "@/components/Shared/StatusFilterPills";
import { useRouter } from "next/navigation";
import {
  DataControlsBar,
  useDataControls,
  type DataControlsConfig,
} from "@/components/Shared/DataControls";
import {
  Add01Icon,
  ArrowLeft02Icon,
  Calendar01Icon,
  Money02Icon,
  TextFontIcon,
  ViewIcon,
  Edit03Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  Invoice03Icon,
  AlertCircleIcon,
  Clock01Icon,
  Invoice02Icon,
  FilterIcon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import {
  getRelativeDateLabel,
  getRelativeWeekLabel,
  compareWeekGroups,
} from "@/components/Shared/utils/groupBy";

// ─── Types ───────────────────────────────────────────────────

type BillStatus = "paid" | "pending" | "overdue";

interface BillItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  payee: string;
  recurring: boolean;
  recurringInterval?: string | null;
  notes?: string | null;
}

function getPeriodLabel(interval?: string | null, recurring?: boolean): string {
  if (interval === "DAILY") return "Harian";
  if (interval === "WEEKLY") return "Mingguan";
  if (interval === "MONTHLY") return "Bulanan";
  if (interval === "YEARLY") return "Tahunan";
  if (recurring) return "Bulanan";
  return "Bulanan";
}

// ─── Helpers ────────────────────────────────────────────────

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

import { getDaysUntilDue } from "@/lib/format";
import { getCategoryIcon } from "@/lib/iconMapping";

// ─── Config ─────────────────────────────────────────────────

const STATUS_META: Record<
  BillStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  paid: {
    label: "Lunas",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  pending: {
    label: "Belum Dibayar",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/25",
    dot: "bg-amber-400",
  },
  overdue: {
    label: "Jatuh Tempo",
    color: "text-red-400",
    bg: "bg-red-500/15 border-red-500/25",
    dot: "bg-red-400",
  },
};

// ─── Page Component ─────────────────────────────────────────

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [activeStatus, setActiveStatus] = useState<"all" | BillStatus>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();

  const CONTROLS_CONFIG: DataControlsConfig = {
    search: {
      placeholder: "Cari tagihan...",
      searchKeys: ["name", "payee"],
    },
    sort: {
      defaultValue: "dueDate",
      fields: [
        { value: "dueDate", label: "Jatuh Tempo", icon: Calendar01Icon },
        { value: "amount", label: "Jumlah", icon: Money02Icon },
        { value: "name", label: "Nama", icon: TextFontIcon },
      ],
    },
    view: { modes: ["list"], defaultMode: "list" },
  };

  // ── Fetch (ganti dengan real API) ──
  const fetchBills = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const nextPage = isLoadMore ? page + 1 : 1;
        const res = await fetch(
          `/api/bills?month=${month}&status=${activeStatus}&page=${nextPage}&limit=100`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data dari server");
        const data = await res.json();

        if (!isLoadMore) {
          setBills(data.bills || []);
          setPage(1);
        } else {
          setBills((prev) => [...prev, ...(data.bills || [])]);
          setPage(nextPage);
        }
        setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch bills:", err);
        if (!isLoadMore) setBills([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [month, page, activeStatus],
  );

  useEffect(() => {
    fetchBills();
  }, [month, activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Month nav
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

  // Stats
  const filteredByStatus =
    activeStatus === "all"
      ? bills
      : bills.filter((b) => b.status === activeStatus);

  const totalDue = bills
    .filter((b) => b.status !== "paid")
    .reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + b.amount, 0);
  const overdueCount = bills.filter((b) => b.status === "overdue").length;

  // Swipe handlers
  const handleView = useCallback((id: string | number) => {
    window.location.href = `/bills/${id}`;
  }, []);
  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/bills/${id}/edit`;
  }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tagihan");
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete bill:", err);
    }
  }, []);

  const handleMarkPaid = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      const data = await res.json();
      if (!res.ok) {
        // We cannot use strict toast without importing useToast, so just a basic alert if it fails
        // Wait, useToast is not imported. We can just use window.alert for now since we don't have toast in this page
        alert(
          data.error ||
            "Gagal membayar tagihan. Pastikan kartu pembayaran sudah diset.",
        );
        throw new Error(data.error || "Gagal membayar tagihan");
      }
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "paid" } : b)),
      );
      alert("Tagihan lunas! Pengeluaran telah otomatis dicatat.");
    } catch (err) {
      console.error("Failed to mark paid:", err);
    }
  }, []);

  const controls = useDataControls<BillItem>(filteredByStatus, CONTROLS_CONFIG);

  const isSearchActive = controls.state.search.trim().length > 0;
  const isSortActive = controls.state.sort.field !== "dueDate";
  const isFlat = isSearchActive || isSortActive;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      {/* ── Sticky Navbar ── */}
      <div className="sticky top-0 z-50">
        <IslandNavbar
          title="Tagihan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/dashboard")}
          actions={[
            {
              icon: (
                <Link href="/bills/add">
                  <HugeiconsIcon icon={Add01Icon} size={18} />
                </Link>
              ),
              onPress: () => {},
              label: "Tambah",
            },
          ]}
        />
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* ── Hero Summary Card ── */}
        <BalanceHeader
          label="Total belum dibayar"
          amount={totalDue}
          variant="indigo"
          isLoading={loading}
          monthSelector={{
            currentMonth: month,
            onPrev: prevMonth,
            onNext: nextMonth,
            style: "sleek",
          }}
          badges={[
            <div
              key="paid"
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={14}
                className="text-emerald-400"
              />
              <span className="text-xs font-mono font-medium text-white">
                IDR {formatIDR(totalPaid)} lunas
              </span>
            </div>,
          ]}
        />

        {/* ── Status Filter Pills ── */}
        <StatusFilterPills
          options={[
            { value: "all", label: "Semua", count: bills.length },
            ...(["pending", "overdue", "paid"] as const).map((s) => ({
              value: s,
              label: STATUS_META[s].label,
              count: bills.filter((b) => b.status === s).length,
              activeBgClass: STATUS_META[s].bg,
              activeTextClass: STATUS_META[s].color,
              dotClass: STATUS_META[s].dot,
            })),
          ]}
          value={activeStatus}
          onChange={(v) => setActiveStatus(v as any)}
          inactiveBgClass="bg-neutral-300 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
        />

        {/* ── DataControlsBar ── */}
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

        {/* ── Bills List ── */}
        <SectionBlock title="" padded={false}>
          <CardList<BillItem>
            items={controls.data}
            layout="detailed"
            enableSwipe={true}
            grouping={
              isFlat
                ? undefined
                : {
                    enabled: true,
                    groupBy: (item) => getRelativeWeekLabel(item.dueDate),
                    groupSorter: compareWeekGroups,
                    showSubtotal: true,
                    subtotalFormatter: (amount) =>
                      `IDR ${formatIDR(Math.abs(amount))}`,
                    amountExtractor: (item) => item.amount,
                    type: "bills",
                  }
            }
            keyExtractor={(b) => b.id}
            renderItem={(bill) => {
              const days = getDaysUntilDue(bill.dueDate);
              const stat = STATUS_META[bill.status];
              return {
                left: (
                  <>
                    {/* Category icon */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 text-lg">
                      <HugeiconsIcon
                        icon={getCategoryIcon(bill.category)}
                        size={22}
                        className="text-indigo-500 dark:text-indigo-400"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {bill.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <HugeiconsIcon
                            icon={ArrowReloadHorizontalIcon}
                            size={13}
                            className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                          />
                          <span className="truncate">
                            {getPeriodLabel(
                              bill.recurringInterval,
                              bill.recurring,
                            )}
                          </span>
                        </div>
                        {bill.status !== "paid" && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">
                              ·
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                days < 0
                                  ? "text-red-400"
                                  : days <= 3
                                    ? "text-amber-400"
                                    : "text-neutral-400"
                              }`}
                            >
                              {days < 0
                                ? `${Math.abs(days)}h lewat`
                                : days === 0
                                  ? "Hari ini"
                                  : `${days} hari lagi`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ),
                right: `IDR ${formatIDR(bill.amount)}`,
                meta: {
                  date: safeFormatDate(bill.dueDate, "dd MMM yyyy"),
                  amount: bill.amount,
                  type: "bills" as const,
                  // Status badge rendered via subtitle slot jika CardList support
                  statusBadge: (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stat.bg} ${stat.color}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${stat.dot}`} />
                      {stat.label}
                    </span>
                  ),
                },
              };
            }}
            swipeActions={[
              {
                id: "view",
                label: "Detail",
                variant: "indigo",
                icon: <HugeiconsIcon icon={ViewIcon} size={18} />,
                onExecute: handleView,
                position: "left",
              },
              {
                id: "pay",
                label: "Bayar",
                variant: "indigo",
                icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />,
                onExecute: handleMarkPaid,
              },
              {
                id: "edit",
                label: "Edit",
                variant: "indigo",
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
                  "Tagihan akan dihapus permanen. Data tidak dapat dikembalikan.",
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
              title: "Belum ada tagihan",
              description:
                "Tambahkan tagihan pertama kamu untuk mulai melacak pembayaran.",
              actions: [
                {
                  id: "add-bill",
                  label: "Tambah Tagihan",
                  onPress: () => (window.location.href = "/bills/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchBills(true)}
            loadingMore={loadingMore}
            className="mt-3"
          />
        </SectionBlock>
      </div>
    </div>
  );
}
