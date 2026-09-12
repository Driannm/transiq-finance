/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Wallet01Icon,
  Calendar02Icon,
  Tag01Icon,
  Note01Icon,
  Edit03Icon,
  Delete02Icon,
  Clock01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  amount: number;
  date: string;
  name: string;
}

interface BillDetail {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "OPEN" | "PAID" | "OVERDUE" | "paid" | "pending" | "overdue";
  category: "utilities" | "subscription" | "rent" | "insurance" | "internet" | "other" | null;
  payee: string | null;
  recurring: boolean;
  notes: string | null;
  cardId: string | null;
  card?: {
    id: string;
    name: string;
    type: string;
  } | null;
  transactions?: Transaction[];
}

interface Card {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

type BillStatus = "paid" | "pending" | "overdue";

const STATUS_META: Record<
  BillStatus,
  { label: string; color: string; bg: string; dot: string; desc: string; icon: any }
> = {
  paid: {
    label: "Lunas",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/35",
    dot: "bg-emerald-500",
    desc: "Tagihan bulan ini sudah dilunasi.",
    icon: CheckmarkCircle01Icon,
  },
  pending: {
    label: "Menunggu",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/35",
    dot: "bg-amber-500",
    desc: "Menunggu pembayaran sebelum jatuh tempo.",
    icon: Clock01Icon,
  },
  overdue: {
    label: "Jatuh Tempo",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/35",
    dot: "bg-red-550",
    desc: "Pembayaran telah melewati batas jatuh tempo!",
    icon: AlertCircleIcon,
  },
};

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  utilities:    { label: "Utilitas",    icon: "⚡" },
  subscription: { label: "Langganan",   icon: "📱" },
  rent:         { label: "Sewa Rumah",  icon: "🏠" },
  insurance:    { label: "Asuransi",   icon: "🛡️" },
  internet:     { label: "Internet",    icon: "🌐" },
  other:        { label: "Lainnya",     icon: "📋" },
};

const CARD_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  BANK: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500 dark:ring-blue-400",
  },
  EWALLET: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500 dark:ring-emerald-400",
  },
  EMONEY: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500 dark:ring-amber-400",
  },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

const fmtFull = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

export default function BillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const toast = useToast();

  const [bill, setBill] = useState<BillDetail | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals status
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBillDetail = async () => {
    try {
      const res = await fetch(`/api/bills/${billId}`);
      if (!res.ok) throw new Error("Tagihan tidak ditemukan");
      const data = await res.json();
      setBill(data.bill);
      if (data.bill.cardId) {
        setSelectedCardId(data.bill.cardId);
      }
    } catch (e: any) {
      toast.show({
        title: "Error Memuat Detail",
        description: e.message || "Gagal menghubungi server",
        variant: "danger",
      });
      router.push("/bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      const list = data.cards ?? [];
      setCards(list);
      if (!selectedCardId && list.length > 0) {
        setSelectedCardId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBillDetail();
    fetchCards();
  }, [billId]);

  // Compute status friendly key
  const getFriendlyStatus = (status?: string): BillStatus => {
    if (!status) return "pending";
    const lower = status.toLowerCase();
    if (lower === "paid" || lower === "lunas") return "paid";
    if (lower === "overdue" || lower === "lewat") return "overdue";
    return "pending";
  };

  const currentStatusKey = bill ? getFriendlyStatus(bill.status) : "pending";
  const statusMeta = STATUS_META[currentStatusKey];

  const handlePayBill = async () => {
    if (!selectedCardId) {
      toast.show({ title: "Pilih kartu pembayaran", variant: "warning" });
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", cardId: selectedCardId }),
      });
      if (res.ok) {
        toast.show({
          title: "Tagihan Sukses Dibayar",
          description: "Saldo berhasil didebit dan pengeluaran tercatat.",
          variant: "success",
          icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="white" />,
          iconBg: "bg-emerald-500",
        });
        setShowPayModal(false);
        fetchBillDetail(); // Refresh
      } else {
        const errorData = await res.json();
        toast.show({
          title: "Gagal Membayar",
          description: errorData.error || "Gagal memproses transaksi",
          variant: "danger",
        });
      }
    } catch {
      toast.show({ title: "Masalah Koneksi", variant: "danger" });
    } finally {
      setPaying(false);
    }
  };

  const handleDeleteBill = async () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus tagihan ini?");
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
      if (res.ok) {
        toast.show({
          title: "Tagihan Dihapus",
          description: "Tagihan telah berhasil dibersihkan dari daftar aktif.",
          variant: "success",
        });
        router.push("/bills");
      } else {
        toast.show({ title: "Gagal Menghapus", variant: "danger" });
      }
    } catch {
      toast.show({ title: "Koneksi Error", variant: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-950">
        <span className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">Memuat Detail Tagihan...</p>
      </div>
    );
  }

  if (!bill) return null;

  const categoryInfo = bill.category ? CATEGORY_MAP[bill.category] : null;

  return (
    <div className="h-screen flex flex-col mb-20 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Detail Tagihan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
          onAvatarPress={() => router.push("/bills")}
        />
      </div>

      <div className="flex-1 overflow-y-auto pt-[64px] pb-32 px-4 space-y-4">
        {/* Status card block */}
        <div className={`p-5 rounded-[24px] border ${statusMeta.bg} flex items-start gap-4 mt-4`}>
          <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex items-center justify-center flex-shrink-0">
            <HugeiconsIcon icon={statusMeta.icon} size={20} className={statusMeta.color} />
          </div>
          <div>
            <h4 className={`text-base font-bold ${statusMeta.color}`}>{statusMeta.label}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{statusMeta.desc}</p>
          </div>
        </div>

        {/* Hero Info (Amount and Name) */}
        <Section className="p-6 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Nominal Tagihan
            </p>
            <h1 className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-50">
              {fmtFull(bill.amount)}
            </h1>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Nama Tagihan
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {bill.name}
            </h3>
          </div>
        </Section>

        {/* Metadata Details List */}
        <Section className="divide-y divide-gray-100 dark:divide-neutral-800">
          {/* Due date row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                <HugeiconsIcon icon={Calendar02Icon} size={18} />
              </div>
              <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Jatuh Tempo</p>
            </div>
            <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
              {isValid(new Date(bill.dueDate))
                ? format(new Date(bill.dueDate), "dd MMMM yyyy", { locale: localeId })
                : "—"}
            </p>
          </div>

          {/* Category detail row */}
          {categoryInfo && (
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
                  <HugeiconsIcon icon={Tag01Icon} size={18} />
                </div>
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Kategori</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{categoryInfo.icon}</span>
                <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{categoryInfo.label}</span>
              </div>
            </div>
          )}

          {/* Payee info row */}
          {bill.payee && (
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center text-slate-500">
                  <span className="text-[13px] font-medium leading-none">💰</span>
                </div>
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Penerima (Payee)</p>
              </div>
              <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{bill.payee}</p>
            </div>
          )}

          {/* Card default detail */}
          {bill.card && (
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
                  <HugeiconsIcon icon={Wallet01Icon} size={18} />
                </div>
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Rekening Default</p>
              </div>
              <p className="text-[13px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/35">
                {bill.card.name}
              </p>
            </div>
          )}

          {/* Notes display */}
          {bill.notes && (
            <div className="px-5 py-4 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-50 dark:bg-stone-900/40 flex items-center justify-center text-stone-500">
                  <HugeiconsIcon icon={Note01Icon} size={18} />
                </div>
                <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Catatan</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap">
                {bill.notes}
              </p>
            </div>
          )}
        </Section>

        {/* Show payment list if paid */}
        {bill.status.toLowerCase() === "paid" && bill.transactions && bill.transactions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2 px-1">
              Riwayat Pembayaran
            </p>
            <Section className="p-4 space-y-3">
              {bill.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{tx.name}</p>
                      <p className="text-[10px] text-gray-400 tabular-nums">
                        {isValid(new Date(tx.date)) ? format(new Date(tx.date), "dd MMM yyyy, HH:mm") : tx.date}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 font-mono">-{fmtFull(tx.amount)}</p>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* Actions panel */}
        <div className="flex gap-3.5 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/bills/${billId}/edit`)}
            className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-gray-50 text-[14px] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-neutral-800 font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <HugeiconsIcon icon={Edit03Icon} size={17} />
            Edit Tagihan
          </button>
          <button
            type="button"
            onClick={handleDeleteBill}
            disabled={deleting}
            className="px-5 py-3.5 rounded-2xl bg-red-500/10 dark:bg-red-950/20 text-red-500 hover:bg-red-500/15 border border-red-500/20 dark:border-red-900/35 flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
          >
            <HugeiconsIcon icon={Delete02Icon} size={17} />
          </button>
        </div>
      </div>

      {/* Floating Action Payment Trigger */}
      {currentStatusKey !== "paid" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-100 via-neutral-100/90 to-transparent dark:from-neutral-950 dark:via-neutral-950/90 dark:to-transparent z-40">
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="
              w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px]
              shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2
            "
          >
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
            Bayar Sekarang (Lunas)
          </button>
        </div>
      )}

      {/* Payment Selection Modal bottom sheet */}
      <AnimatePresence>
        {showPayModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayModal(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-[32px] border-t border-gray-150 dark:border-neutral-800 shadow-2xl p-6 z-55 pb-12 overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pilih Rekening Pembayaran</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">
                Pilih kartu/dompet yang digunakan untuk pemotongan saldo tagihan ini sebesar <strong>{fmtFull(bill.amount)}</strong>.
              </p>

              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1 pb-4">
                {cards.map((card) => {
                  const selected = card.id === selectedCardId;
                  const colors = CARD_COLORS[card.type] ?? CARD_COLORS.BANK;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCardId(card.id)}
                      className={`
                        w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left border-2 transition-all
                        ${selected ? `${colors.bg} ${colors.ring}` : "border-gray-100 dark:border-neutral-800 hover:border-gray-250 dark:hover:border-neutral-755 bg-transparent"}
                      `}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? colors.bg : "bg-gray-50 dark:bg-neutral-850"}`}>
                        <HugeiconsIcon icon={Wallet01Icon} size={16} className={selected ? colors.text : "text-gray-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-bold truncate ${selected ? colors.text : "text-gray-800 dark:text-gray-200"}`}>
                          {card.name}
                        </p>
                        {card.balance !== undefined && (
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{fmtFull(card.balance)}</p>
                        )}
                      </div>
                      {selected && (
                        <div className={`w-5 h-5 rounded-full ${colors.text} border-2 ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`w-2 h-2 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3.5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-[14px] font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePayBill}
                  disabled={paying}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Bayar Sekarang"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
