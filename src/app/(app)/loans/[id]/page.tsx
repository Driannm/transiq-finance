// src/app/(app)/loans/[id]/page.tsx
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
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/Shared/DinamicModal";
import { PaymentForm } from "@/components/Loan/PaymentForm";
import { format, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanCategory = "personal" | "family" | "colleague" | "other";
type LoanStatus = "active" | "ongoing" | "overdue" | "paid";

interface PaymentRecord {
  id: string;
  amount: number;
  paidAt: string;
  notes: string | null;
  cardName: string;
  cardType: string;
}

interface LoanDetail {
  id: string;
  name: string;
  debtor: string;
  category: LoanCategory;
  totalAmount: number;
  returnedAmount: number;
  remaining: number;
  progressPercent: number;
  loanDate: string;
  dueDate: string | null;
  status: LoanStatus;
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

const CATEGORY_ICON: Record<LoanCategory, typeof UserIcon> = {
  personal: UserIcon,
  family: UserGroupIcon,
  colleague: Briefcase01Icon,
  other: ClipboardIcon,
};

const CATEGORY_LABEL: Record<LoanCategory, string> = {
  personal: "Personal",
  family: "Keluarga",
  colleague: "Rekan Kerja",
  other: "Lainnya",
};

const STATUS_META: Record<
  LoanStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Belum Bayar",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40",
  },
  ongoing: {
    label: "Dicicil",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40",
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

export default function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: loanId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Settle confirm
  const [settleOpen, setSettleOpen] = useState(false);
  const [settling, setSettling] = useState(false);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`);
      if (!res.ok) {
        router.push("/loans");
        return;
      }
      const data = await res.json();
      setLoan(data.loan);
    } catch {
      router.push("/loans");
    } finally {
      setLoading(false);
    }
  }, [loanId, router]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  // ── Payment Modal ──

  function openPaymentModal() {
    setPaymentOpen(true);
  }

  // ── Delete ──

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.show({ title: "Piutang berhasil dihapus", variant: "success" });
      router.push("/loans");
    } catch (err: unknown) {
      toast.show({
        title: "Gagal menghapus",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  // ── Settle ──

  async function handleSettle() {
    setSettling(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "settled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.show({ title: "Piutang berhasil dilunasi", variant: "success" });
      setSettleOpen(false);
      await fetchLoan();
    } catch (err: unknown) {
      toast.show({
        title: "Gagal melunasi piutang",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setSettling(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Detail Piutang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/loans")}
          actions={[
            {
              icon: <HugeiconsIcon icon={Edit03Icon} size={18} />,
              onPress: () => router.push(`/loans/${loanId}/edit`),
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
              onPress: () => setDeleteOpen(true),
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
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-500/10 flex items-center justify-center flex-shrink-0">
              {loading ? (
                <Skeleton className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-850 animate-pulse" />
              ) : loan ? (
                <HugeiconsIcon
                  icon={CATEGORY_ICON[loan.category]}
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
              ) : loan ? (
                <div className="animate-fade-in">
                  <h1 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
                    {loan.debtor}
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {loan.name}
                  </p>
                </div>
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
            ) : loan ? (
              <span
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border animate-fade-in",
                  STATUS_META[loan.status].color,
                  STATUS_META[loan.status].bg,
                )}
              >
                {STATUS_META[loan.status].label}
              </span>
            ) : null}
          </div>

          <div className="border-t border-neutral-200/60 dark:border-neutral-800 pt-4">
            <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Nominal Piutang
            </p>
            {loading ? (
              <Skeleton className="h-8 w-44 rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : loan ? (
              <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white animate-fade-in">
                IDR {formatIDR(loan.totalAmount)}
              </h1>
            ) : null}
          </div>
        </div>

        {/* ── Detail Piutang ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 px-1 mb-2">
            Detail Piutang
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
                  IDR {loan && formatIDR(loan.returnedAmount)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Sisa Piutang
              </span>
              {loading ? (
                <Skeleton className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span
                  className={cn(
                    "font-bold font-mono animate-fade-in",
                    loan && loan.remaining > 0
                      ? "text-orange-500 dark:text-orange-400"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  IDR {loan && formatIDR(loan.remaining)}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {(loading || (loan && loan.status !== "paid")) && (
              <div className="pb-3.5 border-b border-neutral-100 dark:border-neutral-800/60 space-y-2">
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                  {loading ? (
                    <>
                      <Skeleton className="h-3.5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                      <Skeleton className="h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                    </>
                  ) : loan ? (
                    <>
                      <span>Terbayar {loan.progressPercent}%</span>
                      <span>
                        {loan.progressPercent < 100
                          ? `Sisa ${100 - loan.progressPercent}%`
                          : "Lunas"}
                      </span>
                    </>
                  ) : null}
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden">
                  {!loading && loan && (
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 animate-fade-in"
                      style={{ width: `${loan.progressPercent}%` }}
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
                  {safeFormatDate(loan?.loanDate)}
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
                    loan?.status === "overdue"
                      ? "text-red-500 font-bold"
                      : "text-neutral-800 dark:text-neutral-200",
                  )}
                >
                  {safeFormatDate(loan?.dueDate)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Hubungan
              </span>
              {loading ? (
                <Skeleton className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              ) : (
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 animate-fade-in">
                  {loan && CATEGORY_LABEL[loan.category]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {(loading || (loan && loan.status !== "paid")) && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400 px-1 mb-2">
              Aksi Piutang
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
                    onClick={() => setSettleOpen(true)}
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
            ) : loan ? (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-[0.05em] bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-800 leading-none animate-fade-in flex-shrink-0">
                {loan.payments.length} transaksi
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
            ) : loan ? (
              loan.payments.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-6 animate-fade-in">
                  Belum ada pembayaran tercatat.
                </p>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {loan.payments.map((p) => (
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
        description={`Catat pengembalian piutang dari ${loan?.debtor}`}
      >
        {loan && (
          <PaymentForm
            loanId={loan.id}
            loanName={loan.name}
            debtorName={loan.debtor}
            remainingAmount={loan.remaining}
            onSuccess={() => {
              setPaymentOpen(false);
              fetchLoan();
            }}
            onCancel={() => setPaymentOpen(false)}
          />
        )}
      </ReusableDialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-650 dark:text-red-400">
              Hapus Piutang?
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh data piutang{" "}
              <strong>{loan?.name}</strong> beserta riwayat pembayarannya akan
              dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Settle Confirm ── */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Tandai Lunas Penuh?
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Sisa piutang sebesar{" "}
              <strong>IDR {formatIDR(loan?.remaining ?? 0)}</strong> akan
              langsung dilunaskan dan saldo rekening akan ditambahkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => setSettleOpen(false)}
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSettle}
              disabled={settling}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              {settling ? "Memproses..." : "Ya, Lunasi"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
