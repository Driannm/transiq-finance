/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Wallet01Icon,
  Calendar02Icon,
  Tag01Icon,
  Note01Icon,
  Settings01Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { updateBillSchema } from "@/app/api/bills/utils/validation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

type BillCategory =
  | "utilities"
  | "subscription"
  | "rent"
  | "insurance"
  | "internet"
  | "other";

const CATEGORY_META: Record<BillCategory, { label: string; icon: string; bg: string; text: string }> = {
  utilities:    { label: "Utilitas",    icon: "⚡", bg: "bg-amber-100 dark:bg-amber-950/40",    text: "text-amber-600 dark:text-amber-400" },
  subscription: { label: "Langganan",   icon: "📱", bg: "bg-purple-100 dark:bg-purple-950/40",  text: "text-purple-600 dark:text-purple-400" },
  rent:         { label: "Sewa Rumah",  icon: "🏠", bg: "bg-blue-100 dark:bg-blue-950/40",      text: "text-blue-600 dark:text-blue-400" },
  insurance:    { label: "Asuransi",   icon: "🛡️", bg: "bg-emerald-100 dark:bg-emerald-950/40",text: "text-emerald-600 dark:text-emerald-400" },
  internet:     { label: "Internet",    icon: "🌐", bg: "bg-sky-100 dark:bg-sky-950/40",        text: "text-sky-600 dark:text-sky-400" },
  other:        { label: "Lainnya",     icon: "📋", bg: "bg-slate-100 dark:bg-slate-950/40",    text: "text-slate-600 dark:text-slate-400" },
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2 px-1">
      {children}
    </p>
  );
}

const fmtFull = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const toast = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState<BillCategory>("utilities");
  const [payee, setPayee] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [createExpense, setCreateExpense] = useState(true);
  const [notes, setNotes] = useState("");
  const [cardId, setCardId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // Fetch Cards
        const cardRes = await fetch("/api/cards");
        const cardData = await cardRes.json();
        if (!live) return;
        setCards(cardData.cards ?? []);

        // Fetch Bill Detail
        const billRes = await fetch(`/api/bills/${billId}`);
        if (!billRes.ok) throw new Error("Gagal memuat detail tagihan");
        const billData = await billRes.json();
        
        if (!live) return;
        const b = billData.bill;
        setName(b.name);
        setAmount(b.amount);
        setDueDate(b.dueDate ? parseISO(b.dueDate) : undefined);
        setCategory(b.category || "utilities");
        setPayee(b.payee || "");
        setRecurring(b.recurring || false);
        setCreateExpense(b.createExpense ?? true);
        setNotes(b.notes || "");
        setCardId(b.cardId || "");

      } catch (e: any) {
        toast.show({
          title: "Gagal Membuka Halaman",
          description: e.message || "Kesalahan memuat data",
          variant: "danger",
        });
        router.push(`/bills/${billId}`);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, [billId]);

  const parseRaw = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
  const formatInput = (n: number) => (n === 0 ? "" : new Intl.NumberFormat("id-ID").format(n));

  const handleUpdate = useCallback(async () => {
    setErrors({});
    
    const formattedDueDate = dueDate ? format(dueDate, "yyyy-MM-dd") : "";

    const payload = {
      name,
      amount: Number(amount),
      dueDate: formattedDueDate,
      category,
      payee: payee || null,
      recurring,
      createExpense,
      notes: notes || null,
      cardId: cardId || null,
    };

    const parsed = updateBillSchema.safeParse(payload);

    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i: any) => {
        const key = i.path[0] as string;
        e[key] = i.message;
      });
      setErrors(e);
      toast.show({
        title: "Perbaikan Input Diperlukan",
        description: parsed.error.issues[0].message,
        variant: "danger",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.show({
          title: "Tagihan Diperbarui",
          description: "Detail tagihan baru berhasil disimpan.",
          variant: "success",
          icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} color="white" />,
          iconBg: "bg-emerald-500",
        });
        setTimeout(() => router.push(`/bills/${billId}`), 600);
      } else {
        const data = await res.json();
        toast.show({
          title: "Gagal Menyimpan Perubahan",
          description: data.error || "Gagal menghubungi server",
          variant: "danger",
        });
      }
    } catch {
      toast.show({ title: "Koneksi Error", variant: "danger" });
    } finally {
      setSaving(false);
    }
  }, [name, amount, dueDate, category, payee, recurring, notes, cardId]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-950">
        <span className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">Memuat Data Tagihan...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col mb-20 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Ubah Tagihan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
          onAvatarPress={() => router.push(`/bills/${billId}`)}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[64px] pb-32">
        {/* Nominal Tagihan HERO */}
        <div className="mx-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-6 pt-5 pb-6 mb-4 mt-4">
          <SectionLabel>Nominal Tagihan</SectionLabel>
          <div className="flex items-baseline gap-2.5">
            <span className="text-lg font-semibold text-gray-400 dark:text-gray-500 select-none">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatInput(amount)}
              onChange={(e) => setAmount(parseRaw(e.target.value))}
              placeholder="0"
              className="
                flex-1 bg-transparent outline-none
                text-[36px] sm:text-[42px] font-bold tracking-tight tabular-nums leading-tight
                text-gray-900 dark:text-gray-50
                placeholder-gray-200 dark:placeholder-gray-700
                caret-blue-500
              "
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-2 px-1">{errors.amount}</p>}
        </div>

        {/* Bill Title & Payee */}
        <div className="mx-4 mb-4 space-y-3">
          <div>
            <SectionLabel>Nama Tagihan</SectionLabel>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 dark:focus-within:border-blue-600 transition-all">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Wifi Rumah, Tagihan Listrik, Sewa Kos..."
                className="w-full bg-transparent text-[15px] font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1.5 px-1">{errors.name}</p>}
          </div>

          <div>
            <SectionLabel>Penerima / Payee (Opsional)</SectionLabel>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 dark:focus-within:border-blue-600 transition-all">
              <input
                type="text"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="Contoh: Biznet, PLN, Tokopedia..."
                className="w-full bg-transparent text-[15px] font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
            {errors.payee && <p className="text-xs text-red-500 mt-1.5 px-1">{errors.payee}</p>}
          </div>
        </div>

        {/* Date and Category Details */}
        <Section className="mx-4 mb-4">
          {/* Due date picker row */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                <HugeiconsIcon icon={Calendar02Icon} size={20} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Jatuh Tempo</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Tentukan tanggal pembayaran</p>
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-neutral-800 text-[13px] font-semibold border border-gray-150 dark:border-neutral-700 text-gray-800 dark:text-gray-200"
                >
                  {dueDate ? format(dueDate, "dd MMMM yyyy", { locale: localeId }) : "Pilih Tanggal"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xl rounded-2xl" align="end">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category selection selector */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
                <HugeiconsIcon icon={Tag01Icon} size={20} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Kategori Tagihan</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Sesuaikan jenis tagihan</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_META) as BillCategory[]).map((catKey) => {
                const isSelected = category === catKey;
                const meta = CATEGORY_META[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`
                      py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200
                      ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/45 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold scale-[1.03] shadow-sm"
                          : "bg-transparent border-gray-200 dark:border-neutral-800 text-gray-500 hover:border-gray-300 dark:hover:border-neutral-700"
                      }
                    `}
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-[11px] font-semibold whitespace-nowrap">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Card Selector Section */}
        <div className="mx-4 mb-4">
          <SectionLabel>Rekening Utama / Default (Opsional)</SectionLabel>
          <Section className="p-2">
            {cards.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <HugeiconsIcon icon={Wallet01Icon} size={18} className="text-gray-300" />
                <span>Tidak ada kartu tersedia</span>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* None Option */}
                <button
                  type="button"
                  onClick={() => setCardId("")}
                  className={`
                    flex-shrink-0 flex items-center justify-center px-4 py-3 rounded-full text-center
                    border-2 transition-all duration-200 min-w-[100px]
                    ${!cardId ? "bg-gray-100 dark:bg-neutral-800 border-neutral-400/80 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold" : "border-gray-100 dark:border-neutral-800 text-gray-400 hover:border-gray-200"}
                  `}
                >
                  <span className="text-xs">Tanpa Kartu</span>
                </button>

                {cards.map((card) => {
                  const selected = card.id === cardId;
                  const colors = CARD_COLORS[card.type] ?? CARD_COLORS.BANK;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setCardId(card.id)}
                      className={`
                        flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-full text-left
                        border-2 transition-all duration-200 min-w-[130px]
                        ${selected ? `${colors.bg} ${colors.ring} shadow-sm` : "border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 bg-transparent"}
                        active:scale-[0.97]
                      `}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? colors.bg : "bg-gray-50 dark:bg-neutral-800"}`}>
                        <HugeiconsIcon icon={Wallet01Icon} size={15} className={selected ? colors.text : "text-gray-400"} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-semibold truncate ${selected ? colors.text : "text-gray-700 dark:text-gray-300"}`}>{card.name}</p>
                        {card.balance !== undefined && (
                          <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">{fmtFull(card.balance)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Recurring Toggle & Notes Section */}
        <Section className="mx-4 mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500">
                <HugeiconsIcon icon={Settings01Icon} size={20} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Tagihan Rutin</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Ulangi secara berkala setiap bulan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRecurring(!recurring)}
              className={`
                w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none relative flex items-center
                ${recurring ? "bg-indigo-600" : "bg-gray-200 dark:bg-neutral-700"}
              `}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 absolute ${recurring ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Catat sebagai Pengeluaran Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
                <HugeiconsIcon icon={Invoice01Icon} size={20} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Catat sebagai Pengeluaran</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Otomatis mencatat transaksi & memotong saldo saat dibayar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateExpense(!createExpense)}
              className={`
                w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none relative flex items-center
                ${createExpense ? "bg-indigo-600" : "bg-gray-200 dark:bg-neutral-700"}
              `}
            >
              <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 absolute ${createExpense ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center text-slate-500">
                <HugeiconsIcon icon={Note01Icon} size={20} />
              </div>
              <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Catatan</p>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus untuk tagihan ini..."
              rows={3}
              className="w-full bg-gray-50/50 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none"
            />
          </div>
        </Section>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-100 via-neutral-100/90 to-transparent dark:from-neutral-950 dark:via-neutral-950/90 dark:to-transparent z-40">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={saving}
          className="
            w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px]
            shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2
          "
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
