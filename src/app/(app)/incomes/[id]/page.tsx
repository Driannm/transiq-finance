// src/app/(app)/income/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import {
  ArrowLeft02Icon, Edit03Icon, Delete02Icon,
  Tag01Icon, Store01Icon, Wallet01Icon,
  Calendar02Icon, Note01Icon, CheckmarkCircle02Icon,
  MoneyReceive02Icon,
} from "@hugeicons/core-free-icons";
import { format, isValid } from "date-fns";
import { getCategoryIcon } from "@/lib/iconMapping";
import { useToast } from "@/hooks/UseToast";
import { useConfirmStore } from "@/store/ConfirmStore";
import { motion } from "framer-motion";

interface IncomeDetail {
  id:     string;
  name:   string;
  notes?: string | null;
  category?: { id: string; name: string } | null;
  source?:   { id: string; name: string } | null;
  transaction: {
    id: string; amount: number; date: string; createdAt: string;
    card: { id: string; name: string; type: string };
  };
}

const fmtIDR  = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.round(n));
const fmtNum  = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));
const safeDate = (iso: string | null | undefined, fmt: string) => { if (!iso) return "—"; const d = new Date(iso); return isValid(d) ? format(d, fmt) : "—"; };

const CARD_COLORS: Record<string, { bg: string; text: string }> = {
  BANK:    { bg: "bg-blue-50 dark:bg-blue-950/40",       text: "text-blue-600 dark:text-blue-400"       },
  EWALLET: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  EMONEY:  { bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-600 dark:text-amber-400"     },
};

function DetailCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100/80 dark:border-neutral-800/80 shadow-sm overflow-hidden ${className}`}>{children}</div>;
}
function DetailRow({ icon, iconBg, iconColor, label, value }: { icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: React.ReactNode; }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 min-h-[56px]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}><span className={iconColor}>{icon}</span></div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px] text-right">{value}</p>
      </div>
    </div>
  );
}
function Divider() { return <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />; }

export default function IncomeDetailPage() {
  const router      = useRouter();
  const params      = useParams();
  const toast       = useToast();
  const openConfirm = useConfirmStore((s) => s.open);
  const id = params?.id as string;

  const [income,   setIncome]   = useState<IncomeDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res  = await fetch(`/api/incomes/${id}`);
        const data = await res.json();
        if (res.ok) setIncome(data.income);
        else toast.show({ title: "Income tidak ditemukan", variant: "danger" });
      } catch { toast.show({ title: "Gagal memuat data", variant: "danger" }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = useCallback(() => {
    openConfirm({
      title: "Hapus Income?", description: "Income akan dihapus permanen. Saldo kartu akan dikurangi.",
      confirmLabel: "Hapus", variant: "danger", icon: <HugeiconsIcon icon={Delete02Icon} size={20} />,
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.show({ title: "Income dihapus", variant: "success", icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="white" />, iconBg: "bg-emerald-500", duration: 3000 });
            setTimeout(() => router.push("/incomes"), 400);
          } else { toast.show({ title: "Gagal menghapus", variant: "danger" }); }
        } catch { toast.show({ title: "Koneksi error", variant: "danger" }); }
        finally { setDeleting(false); }
      },
    });
  }, [id, openConfirm, router, toast]);

  const handleBack = () => { if (window.history.length > 1) window.history.back(); else router.push("/income"); };

  if (loading) return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans">
      <IslandNavbar title="Detail Income" avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />} onAvatarPress={handleBack} />
      <div className="flex-1 overflow-y-auto animate-pulse px-4 pt-2 space-y-3">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100/80 dark:border-neutral-800/80">
          <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded mb-4" />
          <div className="h-10 w-48 bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
        </div>
        {[1,2,3].map((i) => <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100/80 dark:border-neutral-800/80 h-14" />)}
      </div>
    </div>
  );

  if (!income) return null;

  const cardColors = CARD_COLORS[income.transaction.card.type] ?? CARD_COLORS.BANK;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans">
      <IslandNavbar title="Detail Income" avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />} onAvatarPress={handleBack}
        actions={[{ icon: <HugeiconsIcon icon={Edit03Icon} size={18} />, onPress: () => router.push(`/incomes/${id}/edit`), label: "Edit" }]} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-2 pb-8 space-y-3">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <DetailCard className="px-6 pt-5 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <HugeiconsIcon icon={getCategoryIcon(income.category?.name)} size={24} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">{income.category?.name ?? "Tanpa Kategori"}</p>
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 truncate">{income.name}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-gray-400">Rp</span>
                <span className="text-[40px] font-bold tracking-tight tabular-nums leading-none text-emerald-600 dark:text-emerald-400">{fmtNum(income.transaction.amount)}</span>
              </div>
              <p className="mt-2 text-[13px] text-gray-400 tabular-nums">
                {safeDate(income.transaction.date, "EEEE, dd MMMM yyyy")}
                {" · "}<span className="text-gray-300 dark:text-gray-600">Dibuat {safeDate(income.transaction.createdAt, "HH:mm")}</span>
              </p>
            </DetailCard>
          </motion.div>

          {/* Detail rows */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
            <DetailCard>
              <DetailRow icon={<HugeiconsIcon icon={Wallet01Icon} size={18} />} iconBg={cardColors.bg} iconColor={cardColors.text} label="Kartu" value={income.transaction.card.name} />
              <Divider />
              <DetailRow icon={<HugeiconsIcon icon={Calendar02Icon} size={18} />} iconBg="bg-blue-50 dark:bg-blue-950/40" iconColor="text-blue-500 dark:text-blue-400" label="Tanggal" value={safeDate(income.transaction.date, "dd MMM yyyy")} />
              <Divider />
              <DetailRow icon={<HugeiconsIcon icon={Tag01Icon} size={18} />} iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-500 dark:text-emerald-400" label="Kategori" value={income.category?.name ?? <span className="text-gray-400 font-normal">Tidak ada</span>} />
              {income.source && <><Divider /><DetailRow icon={<HugeiconsIcon icon={Store01Icon} size={18} />} iconBg="bg-orange-50 dark:bg-orange-950/40" iconColor="text-orange-500 dark:text-orange-400" label="Sumber" value={income.source.name} /></>}
            </DetailCard>
          </motion.div>

          {/* Notes */}
          {income.notes && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
              <DetailCard className="px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <HugeiconsIcon icon={Note01Icon} size={14} className="text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Catatan</p>
                </div>
                <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{income.notes}</p>
              </DetailCard>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.18 }}>
            <p className="text-center text-[11px] text-gray-300 dark:text-gray-700 font-mono">ID: {income.transaction.id}</p>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3 bg-gradient-to-t from-neutral-100 dark:from-neutral-950 via-neutral-100/95 dark:via-neutral-950/95 to-transparent">
        <motion.button type="button" onClick={handleDelete} disabled={deleting} whileTap={{ scale: 0.97 }}
          className="h-[52px] px-5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 disabled:opacity-50 transition-all">
          <HugeiconsIcon icon={Delete02Icon} size={17} />Hapus
        </motion.button>
        <motion.button type="button" onClick={() => router.push(`/incomes/${id}/edit`)} whileTap={{ scale: 0.97 }}
          className="flex-1 h-[52px] rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all">
          <HugeiconsIcon icon={Edit03Icon} size={17} />Edit Income
        </motion.button>
      </div>
    </div>
  );
}