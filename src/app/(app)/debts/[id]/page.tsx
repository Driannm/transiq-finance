// src/app/(app)/debts/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Edit03Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  UserIcon,
  UserGroupIcon,
  Briefcase01Icon,
  ClipboardIcon,
  Money02Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { useConfirm } from "@/hooks/UseConfirm";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/Shared/ReusableDialog";
import { PaymentForm } from "@/components/DebtLoan/PaymentForm";
import { format, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type DebtCategory = "personal" | "credit_card" | "bank" | "family" | "other";
type DebtStatus = "unpaid" | "partial" | "overdue" | "paid";

interface PaymentRecord {
  id: string;
  amount: number;
  paidAt: string;
  notes: string | null;
  cardName: string;
  cardType: string;
}

interface DebtDetail {
  id: string;
  name: string;
  creditor: string;
  category: DebtCategory;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  progressPercent: number;
  debtDate: string;
  dueDate: string | null;
  status: DebtStatus;
  notes: string | null;
  cardId: string;
  payments: PaymentRecord[];
}

type CardItem = { id: string; name: string; type: string; balance: number };

import { formatIDR, safeDate, parseAmount, formatIDRInput } from "@/lib/format";

const safeFormatDate = (
  dateStr: string | null | undefined,
  fmt = "dd MMM yyyy",
) => {
  return safeDate(dateStr, fmt);
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<DebtCategory, typeof UserIcon> = {
  personal: UserIcon,
  family: UserGroupIcon,
  bank: Briefcase01Icon,
  credit_card: ClipboardIcon,
  other: ClipboardIcon,
};

const CATEGORY_LABEL: Record<DebtCategory, string> = {
  personal: "Personal",
  family: "Keluarga",
  bank: "Bank",
  credit_card: "Kartu Kredit",
  other: "Lainnya",
};

const STATUS_META: Record<
  DebtStatus,
  { label: string; color: string; bg: string }
> = {
  unpaid: {
    label: "Belum Bayar",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40",
  },
  partial: {
    label: "Dicicil",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40",
  },
  overdue: {
    label: "Jatuh Tempo",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40",
  },
  paid: {
    label: "Lunas",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: debtId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);

  const confirm = useConfirm();

  const fetchDebt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/debts/${debtId}`);
      if (!res.ok) {
        router.push("/debts");
        return;
      }
      const data = await res.json();
      setDebt(data.debt);
    } catch {
      router.push("/debts");
    } finally {
      setLoading(false);
    }
  }, [debtId, router]);

  useEffect(() => {
    fetchDebt();
  }, [fetchDebt]);

  // ── Payment Modal ──

  function openPaymentModal() {
    setPaymentOpen(true);
  }

  // ── Delete ──

  async function handleDelete() {
    confirm({
      title: "Hapus Utang?",
      description: `Tindakan ini tidak dapat dibatalkan. Seluruh data utang ${debt?.name} beserta riwayat pembayarannya akan dihapus secara permanen.`,
      variant: "danger",
      confirmLabel: "Hapus",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/debts/${debtId}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.show({ title: "Utang berhasil dihapus", variant: "success" });
          router.push("/debts");
        } catch (err: any) {
          toast.show({
            title: "Gagal menghapus",
            description: err.message || "Terjadi kesalahan",
            variant: "danger",
          });
        }
      },
    });
  }

  // ── Settle ──

  async function handleSettle() {
    confirm({
      title: "Tandai Lunas Penuh?",
      description: `Sisa utang sebesar IDR ${formatIDR(debt?.remaining ?? 0)} akan langsung dibayarkan.`,
      variant: "safe",
      confirmLabel: "Ya, Lunasi",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/debts/${debtId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "paid" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.show({ title: "Utang berhasil dilunasi", variant: "success" });
          await fetchDebt();
        } catch (err: any) {
          toast.show({
            title: "Gagal melunasi utang",
            description: err.message || "Terjadi kesalahan",
            variant: "danger",
          });
        }
      },
    });
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Detail Utang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/debts")}
          actions={[
            {
              icon: <HugeiconsIcon icon={Edit03Icon} size={18} />,
              onPress: () => router.push(`/debts/${debtId}/edit`),
              label: "Edit",
            },
            {
              icon: (
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={18}
                  className="text-red-500 hover:text-red-655 transition-colors"
                />
              ),
              onPress: handleDelete,
              label: "Hapus",
            },
          ]}
        />
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto space-y-6 pt-[64px]">
        {/* ── Header Card ── */}
        <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
          {/* Top: icon + name + status */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-500/10 dark:border-orange-500/10 flex items-center justify-center flex-shrink-0">
              {loading ? (
                <Skeleton className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-850 animate-pulse" />
              ) : debt ? (
                <HugeiconsIcon
                  icon={CATEGORY_ICON[debt.category] || CATEGORY_ICON["other"]}
                  size={22}
                  className="animate-fade-in"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <Skeleton className="h-3.5 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              ) : debt ? (
                <div className="animate-fade-in">
                  <h1 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
                    {debt.creditor}
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {debt.name}
                  </p>
                </div>
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
            ) : debt ? (
              <span
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border animate-fade-in",
                  STATUS_META[debt.status].color,
                  STATUS_META[debt.status].bg,
                )}
              >
                {STATUS_META[debt.status].label}
              </span>
            ) : null}
          </div>

          <div className="border-t border-neutral-200/60 dark:border-neutral-800 pt-4">
            <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Total Utang
            </p>
            {loading ? (
              <Skeleton className="h-8 w-44 rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : debt ? (
              <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white animate-fade-in">
                IDR {formatIDR(debt.totalAmount)}
              </h1>
            ) : null}
          </div>
        </div>

        {/* ── Detail Piutang ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 px-1 mb-2">
            Detail Utang
          </p>
          <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Terbayar
              </span>
              {loading ? (
                <Skeleton className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono animate-fade-in">
                  IDR {debt && formatIDR(debt.paidAmount)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Sisa Utang
              </span>
              {loading ? (
                <Skeleton className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span
                  className={cn(
                    "font-bold font-mono animate-fade-in",
                    debt && debt.remaining > 0
                      ? "text-orange-500 dark:text-orange-400"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  IDR {debt && formatIDR(debt.remaining)}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {(loading || (debt && debt.status !== "paid")) && (
              <div className="pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 space-y-2">
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                  {loading ? (
                    <>
                      <Skeleton className="h-3.5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                      <Skeleton className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                    </>
                  ) : debt ? (
                    <>
                      <span>Terbayar {debt.progressPercent}%</span>
                      <span>
                        {debt.progressPercent < 100
                          ? `Sisa ${100 - debt.progressPercent}%`
                          : "Lunas"}
                      </span>
                    </>
                  ) : null}
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden">
                  {!loading && debt && (
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 animate-fade-in"
                      style={{ width: `${debt.progressPercent}%` }}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Tanggal Diberikan
              </span>
              {loading ? (
                <Skeleton className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 animate-fade-in">
                  {safeFormatDate(debt?.debtDate)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Batas Jatuh Tempo
              </span>
              {loading ? (
                <Skeleton className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span
                  className={cn(
                    "font-semibold animate-fade-in",
                    debt?.status === "overdue"
                      ? "text-red-500 font-bold"
                      : "text-neutral-800 dark:text-neutral-200",
                  )}
                >
                  {safeFormatDate(debt?.dueDate)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Kategori
              </span>
              {loading ? (
                <Skeleton className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 animate-fade-in">
                  {debt && CATEGORY_LABEL[debt.category]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {(loading || (debt && debt.status !== "paid")) && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 px-1 mb-2">
              Aksi Utang
            </p>
            <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-4 flex gap-3 shadow-sm">
              {loading ? (
                <>
                  <Skeleton className="flex-1 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  <Skeleton className="flex-1 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                </>
              ) : (
                <>
                  <button
                    onClick={openPaymentModal}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 transition-colors font-semibold text-sm cursor-pointer animate-fade-in"
                  >
                    <HugeiconsIcon
                      icon={Money02Icon}
                      size={18}
                      className="flex-shrink-0"
                    />
                    Catat Pembayaran
                  </button>
                  <button
                    onClick={handleSettle}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 transition-colors font-semibold text-sm cursor-pointer animate-fade-in"
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={18}
                      className="flex-shrink-0"
                    />
                    Tandai Lunas
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Riwayat Pembayaran ── */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
              Riwayat Pembayaran
            </p>
            {loading ? (
              <Skeleton className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-850 animate-pulse" />
            ) : debt ? (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-[0.05em] bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-800 leading-none animate-fade-in flex-shrink-0">
                {debt.payments.length} transaksi
              </span>
            ) : null}
          </div>
          <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
            {loading ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                      <Skeleton className="h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                    </div>
                    <Skeleton className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : debt ? (
              debt.payments.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6 animate-fade-in">
                  Belum ada pembayaran tercatat.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {debt.payments.map((p) => (
                    <div
                      key={p.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 animate-fade-in"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          + IDR {formatIDR(p.amount)}
                        </p>
                        {p.notes ? (
                          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-1 italic leading-relaxed">
                            {p.notes}
                          </p>
                        ) : (
                          <p className="text-[11.5px] text-neutral-400 dark:text-neutral-500 mt-1 italic">
                            Tanpa catatan
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                          {safeFormatDate(p.paidAt, "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <ReusableDialog
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Catat Pembayaran"
        description={`Catat angsuran cicilan utang kepada ${debt?.creditor}`}
      >
        {debt && (
          <PaymentForm
            obligationId={debt.id}
            obligationName={debt.name}
            personName={debt.creditor}
            remainingAmount={debt.remaining}
            apiPath={`/api/debts/${debt.id}/payments`}
            titleLabel="Utang Aktif"
            personLabel="Kreditur:"
            onSuccess={() => {
              setPaymentOpen(false);
              fetchDebt();
            }}
            onCancel={() => setPaymentOpen(false)}
          />
        )}
      </ReusableDialog>


    </div>
  );
}
