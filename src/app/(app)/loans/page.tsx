/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/loans/page.tsx
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
  Coins01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";

// ─── Types ───────────────────────────────────────────────────

type LoanStatus = "outstanding" | "partial" | "settled";
type LoanCategory = "personal" | "family" | "colleague" | "other";

interface LoanItem {
  id: string;
  name: string;        // deskripsi pinjaman
  debtor: string;      // orang yang berhutang ke kamu
  category: LoanCategory;
  totalAmount: number; // total yang dipinjamkan
  returnedAmount: number; // sudah dikembalikan
  loanDate: string;    // tanggal dipinjamkan
  dueDate: string;     // jatuh tempo pengembalian
  status: LoanStatus;
  notes?: string | null;
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

function getProgressPercent(returned: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((returned / total) * 100));
}

// ─── Config ─────────────────────────────────────────────────

const CATEGORY_ICON: Record<LoanCategory, string> = {
  personal:  "🤝",
  family:    "👨‍👩‍👧",
  colleague: "🏢",
  other:     "📋",
};

const STATUS_META: Record<
  LoanStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  outstanding: { label: "Belum Balik", color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/25", dot: "bg-violet-400" },
  partial:     { label: "Sebagian",    color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/25",   dot: "bg-amber-400"  },
  settled:     { label: "Lunas",       color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/25",dot: "bg-emerald-400"},
};

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_LOANS: LoanItem[] = [
  { id: "1", name: "Pinjam buat beli laptop", debtor: "Dimas Prayoga",  category: "colleague", totalAmount: 4000000,  returnedAmount: 0,       loanDate: "2026-04-01", dueDate: "2026-07-01", status: "outstanding" },
  { id: "2", name: "Pinjam dana darurat",     debtor: "Sari Wulandari", category: "family",    totalAmount: 1500000,  returnedAmount: 750000,  loanDate: "2026-03-15", dueDate: "2026-06-15", status: "partial"     },
  { id: "3", name: "Nombokin tiket konser",   debtor: "Agus Fauzi",     category: "personal",  totalAmount: 350000,   returnedAmount: 0,       loanDate: "2026-05-01", dueDate: "2026-05-28", status: "outstanding" },
  { id: "4", name: "Pinjam buat kos",         debtor: "Tio Ramadhan",   category: "colleague", totalAmount: 800000,   returnedAmount: 800000,  loanDate: "2026-02-01", dueDate: "2026-04-01", status: "settled"     },
  { id: "5", name: "Talang belanja",          debtor: "Mbak Dewi",      category: "family",    totalAmount: 250000,   returnedAmount: 100000,  loanDate: "2026-05-10", dueDate: "2026-06-10", status: "partial"     },
  { id: "6", name: "Pinjam cash wedding",     debtor: "Rizky Maulana",  category: "personal",  totalAmount: 2000000,  returnedAmount: 0,       loanDate: "2026-01-20", dueDate: "2026-06-30", status: "outstanding" },
];

// ─── Page Component ─────────────────────────────────────────

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanItem[]>(MOCK_LOANS);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [activeStatus, setActiveStatus] = useState<"all" | LoanStatus>("all");

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const router = useRouter();

  const CONTROLS_CONFIG: DataControlsConfig = {
    search: {
      placeholder: "Cari piutang...",
      searchKeys: ["name", "debtor"],
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

  const fetchLoans = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      // TODO: ganti dengan real endpoint
      // const res = await fetch(`/api/loans?month=${month}&page=${isLoadMore ? page + 1 : 1}&limit=20`);
      await new Promise((r) => setTimeout(r, 400));
      if (!isLoadMore) { setLoans(MOCK_LOANS); setPage(1); }
      setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch loans:", err);
      if (!isLoadMore) setLoans([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [month, page]);

  useEffect(() => { fetchLoans(); }, [month]); // eslint-disable-line

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
  const filteredByStatus   = activeStatus === "all" ? loans : loans.filter((l) => l.status === activeStatus);
  const totalOutstanding   = loans.filter((l) => l.status !== "settled").reduce((s, l) => s + (l.totalAmount - l.returnedAmount), 0);
  const totalReturned      = loans.reduce((s, l) => s + l.returnedAmount, 0);
  const totalLent          = loans.reduce((s, l) => s + l.totalAmount, 0);
  const overdueCount       = loans.filter((l) => l.status !== "settled" && getDaysUntilDue(l.dueDate) < 0).length;

  // Actions
  const handleView   = useCallback((id: string | number) => { window.location.href = `/loans/${id}`; }, []);
  const handleEdit   = useCallback((id: string | number) => { window.location.href = `/loans/${id}/edit`; }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/loans/${id}`, { method: "DELETE" });
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (err) { console.error(err); }
  }, []);
  const handleMarkSettled = useCallback(async (id: string | number) => {
    try {
      // await fetch(`/api/loans/${id}`, { method: "PATCH", body: JSON.stringify({ status: "settled" }) });
      setLoans((prev) =>
        prev.map((l) => l.id === id ? { ...l, status: "settled", returnedAmount: l.totalAmount } : l)
      );
    } catch (err) { console.error(err); }
  }, []);
  const handleRemind = useCallback((id: string | number) => {
    // TODO: kirim notifikasi / reminder ke debtor
    console.log("Remind debtor for loan:", id);
  }, []);

  const controls = useDataControls<LoanItem>(filteredByStatus, CONTROLS_CONFIG);
  const isFlat = controls.state.search.trim().length > 0 || controls.state.sort.field !== "dueDate";

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">

      {/* ── Navbar ── */}
      <div className="sticky top-0 z-50">
        <IslandNavbar
          title="Piutang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/dashboard")}
          actions={[
            {
              icon: (
                <Link href="/loans/add">
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

        {/* ── Hero Card — Emerald/Teal theme untuk piutang ── */}
        <div
          className="relative overflow-hidden rounded-[24px] p-6 text-white"
          style={{
            background: `
              radial-gradient(circle at top right, rgba(16, 185, 129, 0.95) 0%, rgba(16, 185, 129, 0.35) 18%, transparent 42%),
              radial-gradient(circle at bottom right, rgba(5, 150, 105, 0.85) 0%, rgba(5, 150, 105, 0.22) 20%, transparent 45%),
              linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.20),
              inset -1px 0 0 rgba(16, 185, 129, 0.12),
              0 10px 30px rgba(0,0,0,0.45)
            `,
          }}
        >
          <div className="relative z-10 flex flex-col gap-3.5">

            {/* Label + Month Selector */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50">
                Total piutang belum kembali
              </p>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full select-none">
                <button onClick={prevMonth} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold">‹</button>
                <span className="text-[11px] md:text-xs font-semibold tracking-wide text-white whitespace-nowrap">
                  {safeFormatDate(month + "-01", "MMMM yyyy")}
                </span>
                <button onClick={nextMonth} className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold">›</button>
              </div>
            </div>

            {/* Total Outstanding */}
            <div>
              <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none">
                IDR {formatIDR(totalOutstanding)}
              </h2>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Progress pengembalian</span>
                <span className="text-[10px] font-mono text-white/60">
                  {getProgressPercent(totalReturned, totalLent)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercent(totalReturned, totalLent)}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-emerald-300" />
                <span className="text-xs font-mono font-medium text-white">
                  IDR {formatIDR(totalReturned)} kembali
                </span>
              </div>
              {overdueCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-300">
                    {overdueCount} belum balik, melewati tempo
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "outstanding", "partial", "settled"] as const).map((s) => {
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
                  {s === "all" ? loans.length : loans.filter((l) => l.status === s).length}
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

        {/* ── Loans List ── */}
        <SectionBlock title="Semua Piutang" padded={false}>
          <CardList<LoanItem>
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
                    amountExtractor: (item) => item.totalAmount - item.returnedAmount,
                    typeExtractor: () => "income",
                  }
            }
            keyExtractor={(l) => l.id}
            renderItem={(loan) => {
              const days      = getDaysUntilDue(loan.dueDate);
              const stat      = STATUS_META[loan.status];
              const progress  = getProgressPercent(loan.returnedAmount, loan.totalAmount);
              const remaining = loan.totalAmount - loan.returnedAmount;
              return {
                left: (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 text-lg">
                      {CATEGORY_ICON[loan.category]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {loan.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {loan.debtor}
                        </p>
                        {loan.status !== "settled" && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">·</span>
                            <span className={`text-xs font-medium ${days < 0 ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-neutral-400"}`}>
                              {days < 0 ? `${Math.abs(days)}h lewat` : days === 0 ? "Hari ini" : `${days}h lagi`}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Progress bar per item untuk partial */}
                      {loan.status === "partial" && (
                        <div className="mt-1.5 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ),
                right: `IDR ${formatIDR(remaining)}`,
                meta: {
                  date: safeFormatDate(loan.dueDate, "dd MMM yyyy"),
                  amount: remaining,
                  type: "income" as const,
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
                id: "remind",
                label: "Ingatkan",
                variant: "primary",
                icon: <HugeiconsIcon icon={Coins01Icon} size={18} />,
                onExecute: handleRemind,
              },
              {
                id: "settle",
                label: "Lunas",
                variant: "primary",
                icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />,
                onExecute: handleMarkSettled,
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
                confirmMessage: "Piutang akan dihapus permanen. Data tidak dapat dikembalikan.",
              },
            ]}
            isLoading={loading}
            skeleton={{ fields: ["icon", "title", "subtitle", "amount", "date"], count: 5 }}
            emptyState={{
              icon: <HugeiconsIcon icon={Coins01Icon} size={32} className="text-gray-300 dark:text-gray-600" />,
              title: "Belum ada piutang",
              description: "Catat piutang kamu agar tidak ada yang terlupakan.",
              actions: [
                {
                  id: "add-loan",
                  label: "Tambah Piutang",
                  onPress: () => (window.location.href = "/loans/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchLoans(true)}
            loadingMore={loadingMore}
            enableVirtualization={loans.length > 50}
            itemHeight={96}
            className="mt-3"
          />
        </SectionBlock>
      </div>
    </div>
  );
}