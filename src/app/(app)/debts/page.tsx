/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/debts/page.tsx
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
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Money02Icon,
  TextFontIcon,
  ViewIcon,
  Edit03Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";
import { getDebtCategoryIcon } from "@/lib/iconMapping";

// ─── IMPORT BARU UNTUK MODAL DINAMIS ───
import { ReusableDialog } from "@/components/Shared/DinamicModal";
import { DebtPaymentForm } from "@/components/Shared/DebtsPaymentForm";

// ─── Types ───────────────────────────────────────────────────

type DebtStatus = "unpaid" | "partial" | "paid";
type DebtCategory = "personal" | "credit_card" | "bank" | "family" | "other";

interface DebtItem {
  id: string;
  name: string;
  creditor: string;
  category: DebtCategory;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: DebtStatus;
  notes?: string | null;
  installment: boolean;
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

const STATUS_META: Record<
  DebtStatus,
  { label: string; color: string; bg: string; dot: string; bar: string }
> = {
  unpaid: {
    label: "Belum Bayar",
    color: "text-red-400",
    bg: "bg-red-500/15 border-red-500/25",
    dot: "bg-red-400",
    bar: "bg-red-400",
  },
  partial: {
    label: "Sebagian",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/25",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  paid: {
    label: "Lunas",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/25",
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
  },
};

// ─── Page Component ─────────────────────────────────────────

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [activeStatus, setActiveStatus] = useState<"all" | DebtStatus>("all");

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // ─── STATE DIALOG PEMBAYARAN UTANG ───
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const router = useRouter();

  const CONTROLS_CONFIG: DataControlsConfig = {
    search: {
      placeholder: "Cari utang...",
      searchKeys: ["name", "creditor"],
    },
    sort: {
      defaultValue: "dueDate",
      fields: [
        { value: "dueDate", label: "Jatuh Tempo", icon: Calendar01Icon },
        { value: "totalAmount", label: "Jumlah", icon: Money02Icon },
        { value: "name", label: "Nama", icon: TextFontIcon },
      ],
    },
    view: { modes: ["list"], defaultMode: "list" },
  };

  const fetchDebts = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      try {
        const nextPage = isLoadMore ? page + 1 : 1;
        const res = await fetch(
          `/api/debts?month=${month}&status=${activeStatus}&page=${nextPage}&limit=100`,
        );

        if (!res.ok) throw new Error("Gagal mengambil data dari server");
        const data = await res.json();

        if (!isLoadMore) {
          setDebts(data.debts);
          setPage(1);
        } else {
          setDebts((prev) => [...prev, ...data.debts]);
          setPage(nextPage);
        }
        setHasMore(false);
      } catch (err) {
        console.error("Gagal memuat data utang:", err);
        if (!isLoadMore) setDebts([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [month, page, activeStatus],
  );

  useEffect(() => {
    fetchDebts();
  }, [month, activeStatus]); // eslint-disable-line

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
      ? debts
      : debts.filter((d) => d.status === activeStatus);
  const totalRemaining = debts
    .filter((d) => d.status !== "paid")
    .reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidAmount, 0);
  const overdueCount = debts.filter(
    (d) => d.status !== "paid" && getDaysUntilDue(d.dueDate) < 0,
  ).length;

  // Actions
  const handleView = useCallback(
    (id: string | number) => {
      router.push(`/debts/${id}`);
    },
    [router],
  );
  const handleEdit = useCallback(
    (id: string | number) => {
      router.push(`/debts/${id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus utang");
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ─── UPDATE METHOD MARK PAID ───
  const handlePaid = useCallback((debt: DebtItem) => {
    setSelectedDebt(debt);
    setIsPayModalOpen(true);
  }, []);

  const controls = useDataControls<DebtItem>(filteredByStatus, CONTROLS_CONFIG);
  const isFlat =
    controls.state.search.trim().length > 0 ||
    controls.state.sort.field !== "dueDate";

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
        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <BalanceHeader
            label="Total sisa utang"
            amount={totalRemaining}
            variant="rose"
            isLoading={loading}
            monthSelector={{
              currentMonth: month,
              onPrev: prevMonth,
              onNext: nextMonth,
              style: "sleek",
            }}
            progress={{
              percentage: getProgressPercent(
                totalPaid,
                totalPaid + totalRemaining,
              ),
              labelLeft: "Progress pelunasan",
              labelRight: `${getProgressPercent(totalPaid, totalPaid + totalRemaining)}%`,
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
                  IDR {formatIDR(totalPaid)} terlunasi
                </span>
              </div>,
              ...(overdueCount > 0
                ? [
                    <div
                      key="overdue"
                      className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full"
                    >
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        size={14}
                        className="text-red-400"
                      />
                      <span className="text-xs font-semibold text-red-300">
                        {overdueCount} melewati jatuh tempo
                      </span>
                    </div>,
                  ]
                : []),
            ]}
          />
        </motion.div>

        {/* ── Status Filter Pills ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
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
                {meta && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? meta.dot : "bg-neutral-400"}`}
                  />
                )}
                {s === "all" ? "Semua" : meta!.label}
                <span
                  className={`ml-0.5 font-mono ${isActive ? "" : "text-neutral-400 dark:text-neutral-500"}`}
                >
                  {s === "all"
                    ? debts.length
                    : debts.filter((d) => d.status === s).length}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── DataControlsBar ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
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
        </motion.div>

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
                    subtotalFormatter: (amount) =>
                      `IDR ${formatIDR(Math.abs(amount))}`,
                    amountExtractor: (item) =>
                      item.totalAmount - item.paidAmount,
                    typeExtractor: () => "expense",
                  }
            }
            keyExtractor={(d) => d.id}
            renderItem={(debt) => {
              const days = getDaysUntilDue(debt.dueDate);
              const progress = getProgressPercent(
                debt.paidAmount,
                debt.totalAmount,
              );
              const remaining = debt.totalAmount - debt.paidAmount;

              const CategoryIcon = getDebtCategoryIcon(debt.category);

              return {
                left: (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-300">
                      <HugeiconsIcon icon={CategoryIcon} size={20} />
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
                            <span className="text-neutral-300 dark:text-neutral-600">
                              ·
                            </span>
                            <span
                              className={`text-xs font-medium ${days < 0 ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-neutral-400"}`}
                            >
                              {days < 0
                                ? `${Math.abs(days)}h lewat`
                                : days === 0
                                  ? "Hari ini"
                                  : `${days}h lagi`}
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
                label: "Bayar",
                variant: "primary",
                icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />,
                onExecute: (id) => {
                  const debt = debts.find((d) => d.id === id);
                  if (debt) handlePaid(debt);
                },
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
                  "Utang akan dihapus permanen. Data tidak dapat dikembalikan.",
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
                  icon={CreditCardIcon}
                  size={32}
                  className="text-gray-300 dark:text-gray-600"
                />
              ),
              title: "Belum ada utang",
              description:
                "Catat utang kamu untuk memantau kewajiban pembayaran.",
              actions: [
                {
                  id: "add-debt",
                  label: "Tambah Utang",
                  onPress: () => router.push("/debts/add"),
                  variant: "primary",
                },
              ],
            }}
            hasMore={hasMore}
            onLoadMore={() => fetchDebts(true)}
            loadingMore={loadingMore}
            className="mt-3"
          />
        </SectionBlock>
      </div>

      {/* ─── MODAL DIALOG PEMBAYARAN UTANG (REUSABLE SHADCN) ─── */}
      <ReusableDialog
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pembayaran Utang"
        description="Isi nominal pembayaran cicilan atau lunasi sisa tagihan utang Anda."
      >
        {selectedDebt && (
          <DebtPaymentForm
            debtId={selectedDebt.id}
            debtName={selectedDebt.name}
            remainingAmount={selectedDebt.totalAmount - selectedDebt.paidAmount}
            onSuccess={() => {
              setIsPayModalOpen(false);
              fetchDebts(); // Tarik data real terbaru untuk mengupdate grafik & sisa utang
            }}
            onCancel={() => setIsPayModalOpen(false)}
          />
        )}
      </ReusableDialog>
    </div>
  );
}
