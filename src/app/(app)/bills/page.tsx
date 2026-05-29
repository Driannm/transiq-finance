/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/bills/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
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
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";

// ─── Types ───────────────────────────────────────────────────

type BillStatus = "paid" | "pending" | "overdue";
type BillCategory =
  | "utilities"
  | "subscription"
  | "rent"
  | "insurance"
  | "internet"
  | "other";

interface BillItem {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  status: BillStatus;
  payee: string;
  recurring: boolean;
  notes?: string | null;
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

function getDaysUntilDue(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Config ─────────────────────────────────────────────────

const CATEGORY_ICON: Record<BillCategory, string> = {
  utilities:    "⚡",
  subscription: "📱",
  rent:         "🏠",
  insurance:    "🛡️",
  internet:     "🌐",
  other:        "📋",
};

const STATUS_META: Record<
  BillStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  paid:    { label: "Lunas",    color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25", dot: "bg-emerald-400" },
  pending: { label: "Belum",    color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/25",     dot: "bg-amber-400"   },
  overdue: { label: "Lewat",    color: "text-red-400",     bg: "bg-red-500/15 border-red-500/25",         dot: "bg-red-400"     },
};

// ─── MOCK DATA (ganti dengan fetch API) ────────────────────

const MOCK_BILLS: BillItem[] = [
  { id: "1", name: "Listrik PLN",       category: "utilities",    amount: 142500,  dueDate: "2026-06-01", status: "pending", payee: "PLN",            recurring: true  },
  { id: "2", name: "Netflix",           category: "subscription", amount: 65000,   dueDate: "2026-05-28", status: "overdue", payee: "Netflix Inc.",    recurring: true  },
  { id: "3", name: "Sewa Kos",          category: "rent",         amount: 3500000, dueDate: "2026-06-05", status: "pending", payee: "Pak Budi",        recurring: true  },
  { id: "4", name: "IndiHome",          category: "internet",     amount: 385000,  dueDate: "2026-05-25", status: "paid",    payee: "Telkom",          recurring: true  },
  { id: "5", name: "BPJS Kesehatan",    category: "insurance",    amount: 250000,  dueDate: "2026-05-30", status: "paid",    payee: "BPJS",            recurring: true  },
  { id: "6", name: "Air PDAM",          category: "utilities",    amount: 75000,   dueDate: "2026-06-10", status: "pending", payee: "PDAM",            recurring: true  },
  { id: "7", name: "Spotify Premium",   category: "subscription", amount: 54990,   dueDate: "2026-06-03", status: "pending", payee: "Spotify AB",      recurring: true  },
  { id: "8", name: "Jasa Raharja",      category: "insurance",    amount: 180000,  dueDate: "2026-05-20", status: "paid",    payee: "Jasa Raharja",    recurring: false },
];

// ─── Page Component ─────────────────────────────────────────

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>(MOCK_BILLS);
  const [loading, setLoading] = useState(false);
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
        { value: "dueDate",  label: "Jatuh Tempo", icon: Calendar01Icon },
        { value: "amount",   label: "Jumlah",      icon: Money02Icon    },
        { value: "name",     label: "Nama",        icon: TextFontIcon   },
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
        // TODO: ganti dengan real endpoint
        // const res = await fetch(`/api/bills?month=${month}&page=${isLoadMore ? page + 1 : 1}&limit=20`);
        // const data = await res.json();
        // const newBills = Array.isArray(data.bills) ? data.bills : [];
        // ...
        await new Promise((r) => setTimeout(r, 400)); // simulasi loading
        if (!isLoadMore) {
          setBills(MOCK_BILLS);
          setPage(1);
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
    [month, page]
  );

  useEffect(() => {
    fetchBills();
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const totalDue   = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.amount, 0);
  const totalPaid  = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const overdueCount = bills.filter((b) => b.status === "overdue").length;

  // Swipe handlers
  const handleView   = useCallback((id: string | number) => { window.location.href = `/bills/${id}`; }, []);
  const handleEdit   = useCallback((id: string | number) => { window.location.href = `/bills/${id}/edit`; }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/bills/${id}`, { method: "DELETE" });
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete bill:", err);
    }
  }, []);

  const handleMarkPaid = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/bills/${id}`, { method: "PATCH", body: JSON.stringify({ status: "paid" }) });
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "paid" } : b))
      );
    } catch (err) {
      console.error("Failed to mark paid:", err);
    }
  }, []);

  const controls = useDataControls<BillItem>(filteredByStatus, CONTROLS_CONFIG);

  const isSearchActive = controls.state.search.trim().length > 0;
  const isSortActive   = controls.state.sort.field !== "dueDate";
  const isFlat         = isSearchActive || isSortActive;

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
        <div
          className="relative overflow-hidden rounded-[24px] p-6 text-white"
          style={{
            background: `
              radial-gradient(circle at top right, rgba(99, 102, 241, 0.95) 0%, rgba(99, 102, 241, 0.35) 18%, transparent 42%),
              radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.85) 0%, rgba(79, 70, 229, 0.22) 20%, transparent 45%),
              linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.20),
              inset -1px 0 0 rgba(99, 102, 241, 0.12),
              0 10px 30px rgba(0,0,0,0.45)
            `,
          }}
        >
          <div className="relative z-10 flex flex-col gap-3.5">

            {/* Label + Month Selector */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50">
                Total belum dibayar
              </p>
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

            {/* Amount */}
            <div>
              <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none">
                IDR {formatIDR(totalDue)}
              </h2>
            </div>

            {/* Stat Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Lunas */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-400" />
                <span className="text-xs font-mono font-medium text-white">
                  IDR {formatIDR(totalPaid)} lunas
                </span>
              </div>

              {/* //TODO : Delete or change to something */}
              {/* Overdue warning */}
              {/* {overdueCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">
                    {overdueCount} tagihan lewat jatuh tempo
                  </span>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "pending", "overdue", "paid"] as const).map((s) => {
            const isActive = activeStatus === s;
            const meta = s !== "all" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  isActive
                    ? s === "all"
                      ? "bg-white text-neutral-900 border-white"
                      : `${meta!.bg} ${meta!.color} border-transparent`
                    : "bg-neutral-300 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600" 
                }`}
              >
                {meta && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? meta.dot : "bg-neutral-400"}`} />
                )}
                {s === "all" ? "Semua" : meta!.label}
                <span className={`ml-0.5 font-mono ${isActive ? "" : "text-neutral-400 dark:text-neutral-500"}`}>
                  {s === "all"
                    ? bills.length
                    : bills.filter((b) => b.status === s).length}
                </span>
              </button>
            );
          })}
        </div>

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
                    groupBy: (item) =>
                      getRelativeDateLabel(item.dueDate),
                    showSubtotal: true,
                    subtotalFormatter: (amount) =>
                      `IDR ${formatIDR(Math.abs(amount))}`,
                    amountExtractor: (item) => item.amount,
                    typeExtractor: () => "expense",
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
                      {CATEGORY_ICON[bill.category]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {bill.name}
                        </p>
                        {bill.recurring && (
                          <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                            Rutin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {bill.payee}
                        </p>
                        {bill.status !== "paid" && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">·</span>
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
                  type: "expense" as const,
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
                variant: "primary",
                icon: <HugeiconsIcon icon={ViewIcon} size={18} />,
                onExecute: handleView,
                position: "left",
              },
              {
                id: "pay",
                label: "Bayar",
                variant: "primary",
                icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />,
                onExecute: handleMarkPaid,
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
            enableVirtualization={bills.length > 50}
            itemHeight={96}
            className="mt-3"
          />
        </SectionBlock>
      </div>
    </div>
  );
}