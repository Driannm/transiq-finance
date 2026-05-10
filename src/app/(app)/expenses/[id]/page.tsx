// src/app/expenses/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { 
  ArrowLeft02Icon,
  Edit02Icon,
  Delete01Icon,
  Calendar02Icon,
  Wallet01Icon,
  Tag01Icon,
  Store01Icon,
  Note01Icon,
  Invoice02Icon,
  MoreVerticalIcon,
  Share01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/UseToast";
import { useConfirm } from "@/hooks/UseConfirm";
import { Delete } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Components ─────────────────────────────────────────────

// Info Row Component
function InfoRow({ 
  icon, 
  label, 
  value, 
  valueClass = "text-gray-800 dark:text-gray-200" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
          {label}
        </p>
        <p className={`text-sm font-medium ${valueClass} truncate`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Breakdown Row Component
function BreakdownRow({ 
  label, 
  amount, 
  variant = "neutral",
  indent = false 
}: { 
  label: string; 
  amount: number;
  variant?: "neutral" | "positive" | "negative";
  indent?: boolean;
}) {
  const colors = {
    neutral: "text-gray-600 dark:text-gray-400",
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
  };

  return (
    <div className={`flex items-center justify-between py-2 ${indent ? "ml-4" : ""}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${colors[variant]}`}>
        {variant === "positive" ? "-" : ""}{formatIDR(Math.abs(amount))}
      </span>
    </div>
  );
}

// Action Button Component
function ActionButton({ 
  icon, 
  label, 
  onClick, 
  variant = "default",
  danger = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  variant?: "default" | "primary";
  danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl
        font-semibold text-sm transition-all
        ${danger 
          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800" 
          : variant === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
          : "bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-neutral-800"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  const expenseId = params.id as string;

  // Fetch expense detail
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/${expenseId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setExpense(data.expense);
      } catch (err) {
        console.error("Failed to fetch expense:", err);
        toast.show({
          title: "Gagal memuat data",
          description: "Expense tidak ditemukan",
          variant: "danger",
          duration: 3000,
        });
        router.push("/expenses");
      } finally {
        setLoading(false);
      }
    };

    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId, router, toast]);

  // Delete handler
  const handleDelete = async () => {
    confirm({
      title: "Hapus expense ini?",
      description: "Tindakan ini tidak dapat dibatalkan. Expense akan dihapus permanen.",
      confirmLabel: "Ya, Hapus",
      variant: "danger",
      icon: <HugeiconsIcon icon={Delete01Icon} size={20} />,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/expenses/${expenseId}`, {
            method: "DELETE",
          });
          
          if (res.ok) {
            toast.show({
              title: "✅ Expense dihapus",
              description: expense?.name || "Expense berhasil dihapus",
              variant: "success",
              duration: 3000,
            });
            router.push("/expenses");
          } else {
            throw new Error("Failed to delete");
          }
        } catch (err) {
          toast.show({
            title: "Gagal menghapus",
            description: "Silakan coba lagi",
            variant: "danger",
            duration: 3000,
          });
        }
      },
    });
  };

  const handleEdit = () => {
    router.push(`/expenses/${expenseId}/edit`);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    toast.show({
      title: "Fitur share",
      description: "Akan segera hadir",
      variant: "info",
      duration: 2000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat detail...</p>
        </div>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  const total = expense.transaction.amount;
  const subtotal = total - expense.tax - expense.fee + expense.discount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-sans pb-32">
      {/* Navbar */}
      <IslandNavbar
        title="Detail Expense"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={() => router.back()}
        actions={[
          {
            icon: <HugeiconsIcon icon={MoreVerticalIcon} size={20} />,
            onPress: () => setShowActions(!showActions),
            label: "More",
          },
        ]}
      />

      {/* More Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-16 right-4 z-50 bg-white dark:bg-[#191919] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden w-48"
            >
              <button
                onClick={() => {
                  handleEdit();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <HugeiconsIcon icon={Edit02Icon} size={18} />
                Edit
              </button>
              <button
                onClick={() => {
                  handleShare();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <HugeiconsIcon icon={Share01Icon} size={18} />
                Share
              </button>
              <div className="border-t border-gray-200 dark:border-gray-800" />
              <button
                onClick={() => {
                  handleDelete();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <HugeiconsIcon icon={Delete01Icon} size={18} />
                Hapus
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 space-y-4">
        
        {/* ── Amount Card (Hero) ─────────────────────────── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-3xl p-6 text-white shadow-xl shadow-red-600/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <HugeiconsIcon icon={Invoice02Icon} size={18} />
            </div>
            <span className="text-red-100 text-sm font-medium">Pengeluaran</span>
          </div>
          <motion.p 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold font-mono tracking-tight mb-1"
          >
            {formatIDR(total)}
          </motion.p>
          <p className="text-red-100 text-sm">
            {formatDate(expense.transaction.date)}
          </p>
        </motion.div>

        {/* ── Expense Name ───────────────────────────────── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#191919] rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
        >
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {expense.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(expense.transaction.createdAt)}
          </p>
        </motion.div>

        {/* ── Breakdown Section ──────────────────────────── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#191919] rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
            Rincian
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            <BreakdownRow 
              label="Subtotal"
              amount={subtotal}
              variant="neutral"
            />
            {expense.discount > 0 && (
              <BreakdownRow 
                label="Diskon"
                amount={expense.discount}
                variant="positive"
                indent
              />
            )}
            {expense.tax > 0 && (
              <BreakdownRow 
                label="Pajak"
                amount={expense.tax}
                variant="negative"
                indent
              />
            )}
            {expense.fee > 0 && (
              <BreakdownRow 
                label="Biaya Tambahan"
                amount={expense.fee}
                variant="negative"
                indent
              />
            )}
            <div className="pt-3 mt-2 border-t-2 border-gray-200 dark:border-gray-700">
              <BreakdownRow 
                label="Total"
                amount={total}
                variant="negative"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Details Section ────────────────────────────── */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#191919] rounded-2xl p-2 border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-3 mt-2">
            Informasi
          </h3>
          
          <InfoRow
            icon={<HugeiconsIcon icon={Wallet01Icon} size={18} />}
            label="Kartu"
            value={expense.transaction.card.name}
          />
          
          {expense.category && (
            <InfoRow
              icon={<HugeiconsIcon icon={Tag01Icon} size={18} />}
              label="Kategori"
              value={expense.category.name}
            />
          )}
          
          {expense.merchant && (
            <InfoRow
              icon={<HugeiconsIcon icon={Store01Icon} size={18} />}
              label="Merchant"
              value={expense.merchant.name}
            />
          )}
          
          <InfoRow
            icon={<HugeiconsIcon icon={Calendar02Icon} size={18} />}
            label="Tanggal Transaksi"
            value={formatDate(expense.transaction.date)}
          />

          {expense.notes && (
            <div className="py-3 px-3 mt-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={Note01Icon} size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Catatan
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {expense.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Metadata ───────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center pb-4"
        >
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Dibuat pada {formatDate(expense.transaction.createdAt)}
          </p>
        </motion.div>
      </div>

      {/* ── Sticky Action Buttons ────────────────────────── */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 dark:from-[#0A0A0A] to-transparent"
      >
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            icon={<HugeiconsIcon icon={Edit02Icon} size={18} />}
            label="Edit"
            onClick={handleEdit}
            variant="default"
          />
          <ActionButton
            icon={<HugeiconsIcon icon={Delete01Icon} size={18} />}
            label="Hapus"
            onClick={handleDelete}
            danger
          />
        </div>
      </motion.div>
    </div>
  );
}