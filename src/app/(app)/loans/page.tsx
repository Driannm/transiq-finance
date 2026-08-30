/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/loans/page.tsx
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

type LoanStatus = "active" | "ongoing" | "overdue" | "paid";
type LoanCategory = "personal" | "family" | "colleague" | "other";

interface LoanItem {
  id: string;
  name: string; // deskripsi pinjaman
  debtor: string; // orang yang berhutang ke kamu
  category: LoanCategory;
  totalAmount: number; // total yang dipinjamkan
  returnedAmount: number; // sudah dikembalikan
  loanDate: string; // tanggal dipinjamkan
  dueDate: string; // jatuh tempo pengembalian
  status: LoanStatus;
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

const CATEGORY_ICON: Record<LoanCategory, typeof UserIcon> = {
  personal: UserIcon,
  family: UserGroupIcon,
  colleague: Briefcase01Icon,
  other: ClipboardIcon,
};

const STATUS_META: Record<
  LoanStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Belum Bayar",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20 dark:border-blue-500/25",
  },
  ongoing: {
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
  LoanStatus,
  { label: string; border: string; text: string; bg: string; rotate: string }
> = {
  active: {
    label: "Belum Bayar",
    border: "border-blue-500/50 dark:border-blue-400/50",
    text: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/5 dark:bg-blue-405/5",
    rotate: "-rotate-6",
  },
  ongoing: {
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

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [activeStatus, setActiveStatus] = useState<"all" | LoanStatus>("all");

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const router = useRouter();

  // ─── STATE DIALOG PEMBAYARAN UTANG/PIUTANG ───
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeLoanForPayment, setActiveLoanForPayment] =
    useState<LoanItem | null>(null);

  const toast = useToast();

  const openPaymentModal = (loan: LoanItem) => {
    setActiveLoanForPayment(loan);
    setPaymentModalOpen(true);
  };

  const CONTROLS_CONFIG: DataControlsConfig = {
    search: {
      placeholder: "Cari piutang...",
      searchKeys: ["name", "debtor"],
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

  const fetchLoans = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      try {
        const nextPage = isLoadMore ? page + 1 : 1;
        const res = await fetch(
          `/api/loans?month=${month}&status=${activeStatus}&page=${nextPage}&limit=100`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data dari server");
        const data = await res.json();

        if (!isLoadMore) {
          setLoans(data.loans || []);
          setPage(1);
        } else {
          setLoans((prev) => [...prev, ...(data.loans || [])]);
          setPage(nextPage);
        }
        setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch loans:", err);
        if (!isLoadMore) setLoans([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [month, page, activeStatus],
  );

  useEffect(() => {
    fetchLoans();
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
      ? loans.filter((l) => l.status !== "paid")
      : loans.filter((l) => l.status === activeStatus);
  const totalOutstanding = loans
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + (l.totalAmount - l.returnedAmount), 0);
  const totalReturned = loans.reduce((s, l) => s + l.returnedAmount, 0);
  const totalLent = loans.reduce((s, l) => s + l.totalAmount, 0);
  const overdueCount = loans.filter(
    (l) => l.status !== "paid" && getDaysUntilDue(l.dueDate) < 0,
  ).length;

  // Actions
  const handleView = useCallback((id: string | number) => {
    window.location.href = `/loans/${id}`;
  }, []);
  const handleEdit = useCallback((id: string | number) => {
    window.location.href = `/loans/${id}/edit`;
  }, []);
  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus piutang");
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);
  const handleMarkSettled = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "settled" }),
      });
      if (!res.ok) throw new Error("Gagal melunasi piutang");
      setLoans((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status: "paid", returnedAmount: l.totalAmount }
            : l,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);
  const handleRemind = useCallback((id: string | number) => {
    // TODO: kirim notifikasi / reminder ke debtor
    console.log("Remind debtor for loan:", id);
  }, []);

  const controls = useDataControls<LoanItem>(filteredByStatus, CONTROLS_CONFIG);
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
              "Piutang"
            )
          }
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

      <div className="px-4 pt-4 space-y-5 pt-[64px]">
        {/* ── Hero Card — Emerald/Teal theme untuk piutang ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <BalanceHeader
            label="Total piutang"
            amount={totalOutstanding}
            variant="emerald"
            isLoading={loading}
            monthSelector={{
              currentMonth: month,
              onPrev: prevMonth,
              onNext: nextMonth,
              style: "sleek",
            }}
            progress={{
              percentage: getProgressPercent(totalReturned, totalLent),
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
          {(["all", "active", "ongoing", "overdue", "paid"] as const).map(
            (s) => {
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

        {/* ── Loans List Wrapper ── */}
        <div className="space-y-2">
          {/* ── Status Count Label ── */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 px-1 font-semibold select-none">
            {activeStatus === "all"
              ? `Menampilkan ${filteredByStatus.length} Piutang`
              : `Status ${STATUS_META[activeStatus].label}: ${filteredByStatus.length} Piutang`}
          </p>

          {/* ── Loans List ── */}
          <CardList
            items={controls.data}
            layout="loan"
            keyExtractor={(loan) => loan.id}
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
            onItemPress={(loan) => handleView(loan.id)}
            renderItem={(loan) => {
              const remaining = loan.totalAmount - loan.returnedAmount;
              const progressPercent = getProgressPercent(
                loan.returnedAmount,
                loan.totalAmount,
              );
              const loanData: LoanItemMeta = {
                remaining,
                totalAmount: loan.totalAmount,
                returnedAmount: loan.returnedAmount,
                progressPercent,
                status: loan.status,
                debtor: loan.debtor,
                category: loan.category,
                dueDate: loan.dueDate,
                onRecordPayment: () => openPaymentModal(loan),
              };
              return {
                left: loan.name,
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
              title: "Belum ada piutang",
              description: "Catat piutang kamu agar tidak ada yang terlupakan.",
              variant: "card",
              actions: [
                {
                  id: "add",
                  label: "Tambah Piutang",
                  onPress: () => (window.location.href = "/loans/add"),
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
        title="Catat Pengembalian Piutang"
        description="Catat sebagian atau seluruh pembayaran yang diterima untuk piutang ini."
      >
        {activeLoanForPayment && (
          <PaymentForm
            obligationId={activeLoanForPayment.id}
            obligationName={activeLoanForPayment.name}
            personName={activeLoanForPayment.debtor}
            remainingAmount={
              activeLoanForPayment.totalAmount -
              activeLoanForPayment.returnedAmount
            }
            apiPath={`/api/loans/${activeLoanForPayment.id}/payments`}
            titleLabel="Piutang Aktif"
            personLabel="Debitur:"
            onSuccess={() => {
              setPaymentModalOpen(false);
              fetchLoans();
            }}
            onCancel={() => setPaymentModalOpen(false)}
          />
        )}
      </ReusableDialog>
    </div>
  );
}
