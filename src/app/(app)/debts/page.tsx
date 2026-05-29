/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/debts/page.tsx
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
  AlertCircleIcon,
  UserIcon,
  CreditCardIcon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";

// ─── Types ───────────────────────────────────────────────────

type DebtStatus = "unpaid" | "partial" | "paid";
type DebtCategory = "personal" | "credit_card" | "bank" | "family" | "other";

interface DebtItem {
  id: string;
  name: string;           // nama utang / deskripsi
  creditor: string;       // orang/lembaga yang menagih (kamu berhutang ke mereka)
  category: DebtCategory;
  totalAmount: number;    // total utang
  paidAmount: number;     // sudah dibayar
  dueDate: string;
  status: DebtStatus;
  notes?: string | null;
  installment: boolean;   // cicilan?
}

// ─── Helpers ────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeFormatDate(dateStr: string | null | undefined, fmt: string): string {
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

function getProgressPercent(paid: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

// ─── Config ─────────────────────────────────────────────────

const CATEGORY_ICON: Record<DebtCategory, string> = {
  personal:    "🤝",
  credit_card: "💳",
  bank:        "🏦",
  family:      "👨‍👩‍👧",
  other:       "📋",
};

const CATEGORY_LABEL: Record<DebtCategory, string> = {
  personal:    "Personal",
  credit_card: "Kartu Kredit",
  bank:        "Bank",
  family:      "Keluarga",
  other:       "Lainnya",
};

const STATUS_META: Record<
  DebtStatus,
  { label: string; color: string; bg: string; dot: string; bar: string }
> = {
  unpaid:  { label: "Belum Bayar", color: "text-red-400",     bg: "bg-red-500/15 border-red-500/25",       dot: "bg-red-400",     bar: "bg-red-400"     },
  partial: { label: "Sebagian",    color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/25",   dot: "bg-amber-400",   bar: "bg-amber-400"   },
  paid:    { label: "Lunas",       color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25", dot: "bg-emerald-400", bar: "bg-emerald-400" },
};

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_DEBTS: DebtItem[] = [
  { id: "1", name: "Utang HP",           creditor: "Budi Santoso",  category: "personal",    totalAmount: 2000000,  paidAmount: 0,       dueDate: "2026-06-15", status: "unpaid",  installment: false },
  { id: "2", name: "Cicilan Kredit BCA", creditor: "Bank BCA",      category: "credit_card", totalAmount: 5400000,  paidAmount: 1800000, dueDate: "2026-06-01", status: "partial", installment: true  },
  { id: "3", name: "Pinjam Kakak",       creditor: "Mbak Rina",     category: "family",      totalAmount: 1500000,  paidAmount: 500000,  dueDate: "2026-07-01", status: "partial", installment: false },
  { id: "4", name: "KTA Mandiri",        creditor: "Bank Mandiri",  category: "bank",        totalAmount: 12000000, paidAmount: 12000000,dueDate: "2026-05-10", status: "paid",    installment: true  },
  { id: "5", name: "Utang Makan Siang",  creditor: "Rekan Kantor",  category: "personal",    totalAmount: 150000,   paidAmount: 0,       dueDate: "2026-05-29", status: "unpaid",  installment: false },
  { id: "6", name: "Cicilan Motor",      creditor: "FIF",           category: "bank",        totalAmount: 18000000, paidAmount: 9000000, dueDate: "2026-06-20", status: "partial", installment: true  },
];

// ─── Page Component ─────────────────────────────────────────

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>(MOCK_DEBTS);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [activeStatus, setActiveStatus] = useState<"all" | DebtStatus>("all");

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const router = useRouter();

  const CONTROLS_CONFIG: DataControlsConfig = {
    search: {
      placeholder: "Cari utang...",
      searchKeys: ["name", "creditor"],
    },
    sort: {
      defaultValue: "dueDate",
      fields: [
        { value: "dueDate",      label: "Jatuh Tempo", icon: Calendar01Icon },
        { value: "totalAmount",  label: "Jumlah",      icon: Money02Icon    },
        { value: "name",         label: "Nama",        icon: TextFontIcon   },
      ],
    },
    view: { modes: ["list"], defaultMode: "list" },
  };

  const fetchDebts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      // TODO: ganti dengan real endpoint
      // const res = await fetch(`/api/debts?month=${month}&page=${isLoadMore ? page + 1 : 1}&limit=20`);
      await new Promise((r) => setTimeout(r, 400));
      if (!isLoadMore) { setDebts(MOCK_DEBTS); setPage(1); }
      setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch debts:", err);
      if (!isLoadMore) setDebts([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [month, page]);

  useEffect(() => { fetchDebts(); }, [month]); // eslint-disable-line

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
  const filteredByStatus = activeStatus === "all" ? debts : debts.filter((d) => d.status === activeStatus);
  const totalRemaining   = debts.filter((d) => d.status !== "paid").reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalPaid        = debts.reduce((s, d) => s + d.paidAmount, 0);
  const overdueCount     = debts.filter((d) => d.status !== "paid" && getDaysUntilDue(d.dueDate) < 0).length;

  // Actions
  const handleView   = useCallback((id: string | number) => { window.location.href = `/debts/${id}`; }, []);
  const handleEdit   = useCallback((id: string | number) => { window.location.href = `/debts/${id}/edit`; }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/debts/${id}`, { method: "DELETE" });
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) { console.error(err); }
  }, []);
  const handleMarkPaid = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/debts/${id}`, { method: "PATCH", body: JSON.stringify({ status: "paid" }) });
      setDebts((prev) =>
        prev.map((d) => d.id === id ? { ...d, status: "paid", paidAmount: d.totalAmount } : d)
      );
    } catch (err) { console.error(err); }
  }, []);

  const controls = useDataControls<DebtItem>(filteredByStatus, CONTROLS_CONFIG);
  const isFlat = controls.state.search.trim().length > 0 || controls.state.sort.field !== "dueDate";

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">

      {/* ── Navbar ── */}
      <div className="sticky top-0 z-50">
        <IslandNavbar
          title="Utang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/dashboard")}
          actions={[
            {
              icon: (
                <Link href="/debts/add">
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

        {/* ── Hero Card — Rose/Red theme untuk utang ── */}
        <div
          className="relative overflow-hidden rounded-[24px] p-6 text-white"
          style={{
            background: `
              radial-gradient(circle at top right, rgba(244, 63, 94, 0.95) 0%, rgba(244, 63, 94, 0.35) 18%, transparent 42%),
              radial-gradient(circle at bottom right, rgba(225, 29, 72, 0.85) 0%, rgba(225, 29, 72, 0.22) 20%, transparent 45%),
              linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.20),
              inset -1px 0 0 rgba(244, 63, 94, 0.12),
              0 10px 30px rgba(0,0,0,0.45)
            `,
          }}
        >
          <div className="relative z-10 flex flex-col gap-3.5">

            {/* Label + Month Selector */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50">
                Total sisa utang
              </p>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full select-none">
                <button onClick={prevMonth} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold">‹</button>
                <span className="text-[11px] md:text-xs font-semibold tracking-wide text-white whitespace-nowrap">
                  {safeFormatDate(month + "-01", "MMMM yyyy")}
                </span>
                <button onClick={nextMonth} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold">›</button>
              </div>
            </div>

            {/* Total Remaining */}
            <div>
              <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none">
                IDR {formatIDR(totalRemaining)}
              </h2>
            </div>

            {/* Progress bar — total paid vs grand total */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Progress pelunasan</span>
                <span className="text-[10px] font-mono text-white/60">
                  {getProgressPercent(totalPaid, totalPaid + totalRemaining)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercent(totalPaid, totalPaid + totalRemaining)}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-400" />
                <span className="text-xs font-mono font-medium text-white">
                  IDR {formatIDR(totalPaid)} terlunasi
                </span>
              </div>
              {overdueCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">
                    {overdueCount} melewati jatuh tempo
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "unpaid", "partial", "paid"] as const).map((s) => {
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
                    : "bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border-transparent"
                }`}
              >
                {meta && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? meta.dot : "bg-neutral-400"}`} />}
                {s === "all" ? "Semua" : meta!.label}
                <span className={`ml-0.5 font-mono ${isActive ? "" : "text-neutral-400 dark:text-neutral-500"}`}>
                  {s === "all" ? debts.length : debts.filter((d) => d.status === s).length}
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

        {/* ── Debt List ── */}
        <SectionBlock title="Semua Utang" padded={false}>
          <CardList<DebtItem>
            items={controls.data}
            layout="detailed"
            enableSwipe={true}
            grouping={
              isFlat
                ? undefined
                : {
                    enabled: true,
                    groupBy: (item) => getRelativeDateLabel(item.dueDate),
                    showSubtotal: true,
                    subtotalFormatter: (amount) => `IDR ${formatIDR(Math.abs(amount))}`,
                    amountExtractor: (item) => item.totalAmount - item.paidAmount,
                    typeExtractor: () => "expense",
                  }
            }
            keyExtractor={(d) => d.id}
            renderItem={(debt) => {
              const days     = getDaysUntilDue(debt.dueDate);
              const stat     = STATUS_META[debt.status];
              const progress = getProgressPercent(debt.paidAmount, debt.totalAmount);
              const remaining = debt.totalAmount - debt.paidAmount;
              return {
                left: (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0 text-lg">
                      {CATEGORY_ICON[debt.category]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {debt.name}
                        </p>
                        {debt.installment && (
                          <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                            Cicilan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {debt.creditor}
                        </p>
                        {debt.status !== "paid" && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">·</span>
                            <span className={`text-xs font-medium ${days < 0 ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-neutral-400"}`}>
                              {days < 0 ? `${Math.abs(days)}h lewat` : days === 0 ? "Hari ini" : `${days}h lagi`}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Progress bar per item */}
                      {debt.status === "partial" && (
                        <div className="mt-1.5 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ),
                right: `IDR ${formatIDR(remaining)}`,
                meta: {
                  date: safeFormatDate(debt.dueDate, "dd MMM yyyy"),
                  amount: remaining,
                  type: "expense" as const,
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
                label: "Lunasi",
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
                confirmMessage: "Utang akan dihapus permanen. Data tidak dapat dikembalikan.",
              },
            ]}
            isLoading={loading}
            skeleton={{ fields: ["icon", "title", "subtitle", "amount", "date"], count: 5 }}
            emptyState={{
              icon: <HugeiconsIcon icon={CreditCardIcon} size={32} className="text-gray-300 dark:text-gray-600" />,
              title: "Belum ada utang",
              description: "Catat utang kamu untuk memantau kewajiban pembayaran.",
              actions: [
                {
                  id: "add-debt",
                  label: "Tambah Utang",
                  onPress: () => (window.location.href = "/debts/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchDebts(true)}
            loadingMore={loadingMore}
            enableVirtualization={debts.length > 50}
            itemHeight={96}
            className="mt-3"
          />
        </SectionBlock>
      </div>
    </div>
  );
}