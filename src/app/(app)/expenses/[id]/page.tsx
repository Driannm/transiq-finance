// src/app/(app)/expenses/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import {
  ArrowLeft02Icon,
  Edit03Icon,
  Delete02Icon,
  Tag01Icon,
  Store01Icon,
  Wallet01Icon,
  Calendar02Icon,
  Note01Icon,
  PercentCircleIcon,
  Add01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { format, isValid } from "date-fns";
import { getCategoryIcon } from "@/lib/iconMapping";
import { useToast } from "@/hooks/UseToast";
import { useConfirmStore } from "@/store/ConfirmStore";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpenseDetail {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

const fmtNum = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Math.round(n));

function safeDate(iso: string | null | undefined, fmt: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isValid(d) ? format(d, fmt) : "—";
}

// Derive subtotal from total and adjustments
function getSubtotal(e: ExpenseDetail): number {
  return e.transaction.amount - e.tax - e.fee + e.discount;
}

const CARD_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  BANK:    { bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400"    },
  EWALLET: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  EMONEY:  { bg: "bg-amber-50 dark:bg-amber-950/40",  text: "text-amber-600 dark:text-amber-400"  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100/80 dark:border-neutral-800/80 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function DetailRow({
  icon, iconBg, iconColor, label, value, mono = false,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; value: React.ReactNode; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 min-h-[56px]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px] text-right ${mono ? "font-mono tabular-nums" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 px-4 pt-2">
      {/* Hero */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100/80 dark:border-neutral-800/80">
        <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded mb-4" />
        <div className="h-10 w-48 bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-neutral-800 rounded" />
      </div>
      {/* Rows */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100/80 dark:border-neutral-800/80 px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-neutral-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-800 rounded" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const toast   = useToast();
  const openConfirm = useConfirmStore((s) => s.open);

  const id = params?.id as string;

  const [expense,  setExpense]  = useState<ExpenseDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res  = await fetch(`/api/expenses/${id}`);
        const data = await res.json();
        if (res.ok) setExpense(data.expense);
        else toast.show({ title: "Expense tidak ditemukan", variant: "danger" });
      } catch {
        toast.show({ title: "Gagal memuat data", variant: "danger" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    openConfirm({
      title:        "Hapus Expense?",
      description:  "Expense akan dihapus permanen. Saldo kartu akan dikembalikan.",
      confirmLabel: "Hapus",
      variant:      "danger",
      icon:         <HugeiconsIcon icon={Delete02Icon} size={20} />,
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.show({
              title:       "Expense dihapus",
              variant:     "success",
              icon:        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="white" />,
              iconBg:      "bg-emerald-500",
              duration:    3000,
            });
            setTimeout(() => router.push("/expenses"), 400);
          } else {
            toast.show({ title: "Gagal menghapus", variant: "danger" });
          }
        } catch {
          toast.show({ title: "Koneksi error", variant: "danger" });
        } finally {
          setDeleting(false);
        }
      },
    });
  }, [id, openConfirm, router, toast]);

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else router.push("/expenses");
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans">
        <IslandNavbar
          title="Detail Expense"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
          onAvatarPress={handleBack}
        />
        <div className="flex-1 overflow-y-auto">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (!expense) return null;

  // ── Derived values ─────────────────────────────────────────────────────────
  const subtotal     = getSubtotal(expense);
  const total        = expense.transaction.amount;
  const hasBreakdown = expense.discount > 0 || expense.tax > 0 || expense.fee > 0;
  const cardColors   = CARD_TYPE_COLOR[expense.transaction.card.type] ?? CARD_TYPE_COLOR.BANK;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans">
      <IslandNavbar
        title="Detail Expense"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
        onAvatarPress={handleBack}
        actions={[
          {
            icon: <HugeiconsIcon icon={Edit03Icon} size={18} />,
            onPress: () => router.push(`/expenses/${id}/edit`),
            label: "Edit",
          },
        ]}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-2 pb-8 space-y-3">

          {/* ── Hero — amount + name ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DetailCard className="px-6 pt-5 pb-6">
              {/* Category icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={getCategoryIcon(expense.category?.name)}
                    size={24}
                    className="text-red-500 dark:text-red-400"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                    {expense.category?.name ?? "Tanpa Kategori"}
                  </p>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {expense.name}
                  </p>
                </div>
              </div>

              {/* Total amount */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-gray-400 dark:text-gray-500">Rp</span>
                <span className="text-[40px] font-bold tracking-tight tabular-nums leading-none text-gray-900 dark:text-gray-50">
                  {fmtNum(total)}
                </span>
              </div>

              {/* Date + time */}
              <p className="mt-2 text-[13px] text-gray-400 dark:text-gray-500 tabular-nums">
                {safeDate(expense.transaction.date, "EEEE, dd MMMM yyyy")}
                {" · "}
                <span className="text-gray-300 dark:text-gray-600">
                  Dibuat {safeDate(expense.transaction.createdAt, "HH:mm")}
                </span>
              </p>

              {/* Breakdown pills — jika ada */}
              {hasBreakdown && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap gap-2">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 self-center">
                    Subtotal {fmtIDR(subtotal)}
                  </span>
                  {expense.discount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      − Diskon {fmtNum(expense.discount)}
                    </span>
                  )}
                  {expense.tax > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400">
                      + Pajak {fmtNum(expense.tax)}
                    </span>
                  )}
                  {expense.fee > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400">
                      + Biaya {fmtNum(expense.fee)}
                    </span>
                  )}
                </div>
              )}
            </DetailCard>
          </motion.div>

          {/* ── Detail rows ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            <DetailCard>
              {/* Kartu */}
              <DetailRow
                icon={<HugeiconsIcon icon={Wallet01Icon} size={18} />}
                iconBg={cardColors.bg}
                iconColor={cardColors.text}
                label="Kartu"
                value={expense.transaction.card.name}
              />
              <Divider />

              {/* Tanggal */}
              <DetailRow
                icon={<HugeiconsIcon icon={Calendar02Icon} size={18} />}
                iconBg="bg-blue-50 dark:bg-blue-950/40"
                iconColor="text-blue-500 dark:text-blue-400"
                label="Tanggal"
                value={safeDate(expense.transaction.date, "dd MMM yyyy")}
              />
              <Divider />

              {/* Kategori */}
              <DetailRow
                icon={<HugeiconsIcon icon={Tag01Icon} size={18} />}
                iconBg="bg-violet-50 dark:bg-violet-950/40"
                iconColor="text-violet-500 dark:text-violet-400"
                label="Kategori"
                value={expense.category?.name ?? <span className="text-gray-400 dark:text-gray-600 font-normal">Tidak ada</span>}
              />

              {/* Merchant — hanya jika ada */}
              {expense.merchant && (
                <>
                  <Divider />
                  <DetailRow
                    icon={<HugeiconsIcon icon={Store01Icon} size={18} />}
                    iconBg="bg-orange-50 dark:bg-orange-950/40"
                    iconColor="text-orange-500 dark:text-orange-400"
                    label="Merchant"
                    value={expense.merchant.name}
                  />
                </>
              )}
            </DetailCard>
          </motion.div>

          {/* ── Breakdown — hanya jika ada ── */}
          {hasBreakdown && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <DetailCard>
                <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                    Rincian Harga
                  </p>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-[14px] font-semibold font-mono tabular-nums text-gray-900 dark:text-gray-100">
                    {fmtIDR(subtotal)}
                  </span>
                </div>

                {expense.discount > 0 && (
                  <>
                    <Divider />
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Tag01Icon} size={14} className="text-emerald-500" />
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">Diskon</span>
                      </div>
                      <span className="text-[14px] font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        − {fmtIDR(expense.discount)}
                      </span>
                    </div>
                  </>
                )}

                {expense.tax > 0 && (
                  <>
                    <Divider />
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={PercentCircleIcon} size={14} className="text-red-400" />
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">Pajak</span>
                      </div>
                      <span className="text-[14px] font-semibold font-mono tabular-nums text-red-500 dark:text-red-400">
                        + {fmtIDR(expense.tax)}
                      </span>
                    </div>
                  </>
                )}

                {expense.fee > 0 && (
                  <>
                    <Divider />
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Add01Icon} size={14} className="text-orange-400" />
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">Biaya Tambahan</span>
                      </div>
                      <span className="text-[14px] font-semibold font-mono tabular-nums text-orange-500 dark:text-orange-400">
                        + {fmtIDR(expense.fee)}
                      </span>
                    </div>
                  </>
                )}

                {/* Total */}
                <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800 mt-1" />
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-[16px] font-bold font-mono tabular-nums text-gray-900 dark:text-gray-50">
                    {fmtIDR(total)}
                  </span>
                </div>
              </DetailCard>
            </motion.div>
          )}

          {/* ── Notes — hanya jika ada ── */}
          {expense.notes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              <DetailCard className="px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <HugeiconsIcon icon={Note01Icon} size={14} className="text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                    Catatan
                  </p>
                </div>
                <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  {expense.notes}
                </p>
              </DetailCard>
            </motion.div>
          )}

          {/* ── Transaction ID ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.24 }}
          >
            <p className="text-center text-[11px] text-gray-300 dark:text-gray-700 font-mono px-4">
              ID: {expense.transaction.id}
            </p>
          </motion.div>

        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3 bg-gradient-to-t from-neutral-100 dark:from-neutral-950 via-neutral-100/95 dark:via-neutral-950/95 to-transparent">
        {/* Delete */}
        <motion.button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          whileTap={{ scale: 0.97 }}
          className="h-[52px] px-5 rounded-2xl font-semibold text-[14px] transition-all
            flex items-center justify-center gap-2
            bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400
            hover:bg-red-100 dark:hover:bg-red-950/60
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HugeiconsIcon icon={Delete02Icon} size={17} />
          Hapus
        </motion.button>

        {/* Edit */}
        <motion.button
          type="button"
          onClick={() => router.push(`/expenses/${id}/edit`)}
          whileTap={{ scale: 0.97 }}
          className="flex-1 h-[52px] rounded-2xl font-semibold text-[15px] transition-all
            flex items-center justify-center gap-2
            bg-gray-900 dark:bg-white text-white dark:text-gray-900
            shadow-lg shadow-gray-900/15 dark:shadow-white/10"
        >
          <HugeiconsIcon icon={Edit03Icon} size={17} />
          Edit Expense
        </motion.button>
      </div>
    </div>
  );
}