/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/debts/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { BalanceHeader } from "@/components/Shared/BalanceHeader";
import { CardList } from "@/components/Shared/CardList";
import type { LoanItemMeta } from "@/components/Shared/CardList/types";
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
  Coins01Icon,
  UserIcon,
  UserGroupIcon,
  Briefcase01Icon,
  ClipboardIcon,
} from "@hugeicons/core-free-icons";

import Link from "next/link";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { getRelativeDateLabel } from "@/components/Shared/utils/groupBy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ReusableDialog } from "@/components/Shared/ReusableDialog";
import { PaymentForm } from "@/components/DebtLoan/PaymentForm";
import { useToast } from "@/hooks/UseToast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────

type DebtStatus = "unpaid" | "partial" | "overdue" | "paid";
type DebtCategory = "personal" | "family" | "colleague" | "other";

interface DebtItem {
  id: string;
  name: string; // deskripsi pinjaman
  creditor: string; // orang yang berhutang ke kamu
  category: DebtCategory;
  totalAmount: number; // total yang dipinjamkan
  paidAmount: number; // sudah dikembalikan
  debtDate: string; // tanggal dipinjamkan
  dueDate: string; // jatuh tempo pengembalian
  status: DebtStatus;
  notes?: string | null;
}

import { formatIDR, safeDate, daysUntil, calcProgress } from "@/lib/format";

const safeFormatDate = (dateStr: string | null | undefined, fmt: string) => {
  return safeDate(dateStr, fmt);
};

const getDaysUntilDue = (dateStr: string) => {
  return daysUntil(dateStr);
};

const getProgressPercent = (returned: number, total: number) => {
  return calcProgress(returned, total);
};

// ─── Config ─────────────────────────────────────────────────

const CATEGORY_ICON: Record<DebtCategory, typeof UserIcon> = {
  personal: UserIcon,
  family: UserGroupIcon,
  colleague: Briefcase01Icon,
  other: ClipboardIcon,
};

const STATUS_META: Record<
  DebtStatus,
  { label: string; color: string; bg: string }
> = {
  unpaid: {
    label: "Belum Bayar",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20 dark:border-blue-500/25",
  },
  partial: {
    label: "Dicicil",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 dark:border-amber-500/25",
  },
  overdue: {
    label: "Jatuh Tempo",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/15 border-red-500/20 dark:border-red-500/25",
  },
  paid: {
    label: "Lunas",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/25",
  },
};

const STAMP_META: Record<
  DebtStatus,
  { label: string; border: string; text: string; bg: string; rotate: string }
> = {
  unpaid: {
    label: "Belum Bayar",
    border: "border-blue-500/50 dark:border-blue-400/50",
    text: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/5 dark:bg-blue-405/5",
    rotate: "-rotate-6",
  },
  partial: {
    label: "Dicicil",
    border: "border-amber-500/55 dark:border-amber-400/55",
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/5 dark:bg-amber-405/5",
    rotate: "-rotate-3",
  },
  overdue: {
    label: "Jatuh Tempo",
    border: "border-red-500/60 dark:border-red-400/60",
    text: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/5 dark:bg-red-405/5",
    rotate: "-rotate-12",
  },
  paid: {
    label: "Lunas",
    border: "border-emerald-600/70 dark:border-emerald-400/70",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/10 dark:bg-emerald-400/10",
    rotate: "-rotate-12 scale-110",
  },
};

// ─── Page Component ─────────────────────────────────────────

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [unpaidStatus, setActiveStatus] = useState<"all" | DebtStatus>("all");

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const router = useRouter();

  // ─── STATE DIALOG PEMBAYARAN UTANG/PIUTANG ───
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [unpaidDebtForPayment, setActiveDebtForPayment] =
    useState<DebtItem | null>(null);

  const toast = useToast();

  const openPaymentModal = (debt: DebtItem) => {
    setActiveDebtForPayment(debt);
    setPaymentModalOpen(true);
  };

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
          `/api/debts?month=${month}&status=${unpaidStatus}&page=${nextPage}&limit=100`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data dari server");
        const data = await res.json();

        if (!isLoadMore) {
          setDebts(data.debts || []);
          setPage(1);
        } else {
          setDebts((prev) => [...prev, ...(data.debts || [])]);
          setPage(nextPage);
        }
        setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch debts:", err);
        if (!isLoadMore) setDebts([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [month, page, unpaidStatus],
  );

  useEffect(() => {
    fetchDebts();
  }, [month, unpaidStatus]); // eslint-disable-line

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
    unpaidStatus === "all"
      ? debts.filter((l) => l.status !== "paid")
      : debts.filter((l) => l.status === unpaidStatus);
  const totalOutstanding = debts
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + (l.totalAmount - l.paidAmount), 0);
  const totalReturned = debts.reduce((s, l) => s + l.paidAmount, 0);
  const totalDebt = debts.reduce((s, l) => s + l.totalAmount, 0);
  const overdueCount = debts.filter(
    (l) => l.status !== "paid" && getDaysUntilDue(l.dueDate) < 0,
  ).length;

  // Actions
  const handleView = useCallback((id: string | number) => {
    window.location.href = `/debts/${id}`;
  }, []);
  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/debts/${id}/edit`;
  }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus utang");
      setDebts((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);
  const handleMarkSettled = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "settled" }),
      });
      if (!res.ok) throw new Error("Gagal melunasi utang");
      setDebts((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status: "paid", paidAmount: l.totalAmount }
            : l,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);
  const handleRemind = useCallback((id: string | number) => {
    // TODO: kirim notifikasi / reminder ke creditor
    console.log("Remind creditor for debt:", id);
  }, []);

  const controls = useDataControls<DebtItem>(filteredByStatus, CONTROLS_CONFIG);
  const isFlat =
    controls.state.search.trim().length > 0 ||
    controls.state.sort.field !== "dueDate";

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans pb-24">
      {/* ── Navbar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title={
            loading ? (
              <span className="inline-block w-16 h-3.5 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md mt-1" />
            ) : (
              "Utang"
            )
          }
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

      <div className="px-4 pt-4 space-y-5 pt-[64px]">
        {/* ── Hero Card — Emerald/Teal theme untuk utang ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <BalanceHeader
            label="Total utang"
            amount={totalOutstanding}
            variant="rose"
            isLoading={loading}
            monthSelector={{
              currentMonth: month,
              onPrev: prevMonth,
              onNext: nextMonth,
              style: "sleek",
            }}
            progress={{
              percentage: getProgressPercent(totalReturned, totalDebt),
              labelLeft: "Terbayar",
              labelRight: `IDR ${formatIDR(totalReturned)}`,
            }}
          />
        </motion.div>

        {/* ── Status Filter Pills ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {(["all", "unpaid", "partial", "overdue", "paid"] as const).map(
            (s) => {
              const isActive = unpaidStatus === s;
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
                  {s === "all" ? "Semua" : meta!.label}
                </button>
              );
            },
          )}
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

        {/* ── Debts List Wrapper ── */}
        <div className="space-y-2">
          {/* ── Status Count Label ── */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 px-1 font-semibold select-none">
            {unpaidStatus === "all"
              ? `Menampilkan ${filteredByStatus.length} Utang`
              : `Status ${STATUS_META[unpaidStatus].label}: ${filteredByStatus.length} Utang`}
          </p>

          {/* ── Debts List ── */}
          <CardList
            items={controls.data}
            layout="loan"
            keyExtractor={(debt) => debt.id}
            isLoading={loading}
            skeleton={{
              fields: [
                "icon",
                "title",
                "subtitle",
                "amount",
                "date",
                "bottom",
                "badge",
              ],
              count: 4,
            }}
            onItemPress={(debt) => handleView(debt.id)}
            renderItem={(debt) => {
              const remaining = debt.totalAmount - debt.paidAmount;
              const progressPercent = getProgressPercent(
                debt.paidAmount,
                debt.totalAmount,
              );
              const loanData: LoanItemMeta = {
                remaining,
                totalAmount: debt.totalAmount,
                returnedAmount: debt.paidAmount,
                progressPercent,
                status: debt.status as any,
                debtor: debt.creditor,
                category: debt.category as any,
                dueDate: debt.dueDate,
                isDebt: true,
                onRecordPayment: () => openPaymentModal(debt),
              };
              return {
                left: debt.name,
                right: null,
                meta: { loanData },
              };
            }}
            emptyState={{
              icon: (
                <HugeiconsIcon
                  icon={Coins01Icon}
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
              ),
              title: "Belum ada utang",
              description: "Catat utang kamu agar tidak ada yang terlupakan.",
              variant: "card",
              actions: [
                {
                  id: "add",
                  label: "Tambah Utang",
                  onPress: () => (window.location.href = "/debts/add"),
                  variant: "primary",
                },
              ],
            }}
          />
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      <ReusableDialog
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Catat Pengembalian Utang"
        description="Catat sebagian atau seluruh pembayaran yang diterima untuk utang ini."
      >
        {unpaidDebtForPayment && (
          <PaymentForm
            obligationId={unpaidDebtForPayment.id}
            obligationName={unpaidDebtForPayment.name}
            personName={unpaidDebtForPayment.creditor}
            remainingAmount={
              unpaidDebtForPayment.totalAmount -
              unpaidDebtForPayment.paidAmount
            }
            apiPath={`/api/debts/${unpaidDebtForPayment.id}/payments`}
            titleLabel="Utang Aktif"
            personLabel="Kreditur:"
            onSuccess={() => {
              setPaymentModalOpen(false);
              fetchDebts();
            }}
            onCancel={() => setPaymentModalOpen(false)}
          />
        )}
      </ReusableDialog>
    </div>
  );
}
