/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import {
  ArrowLeft02Icon,
  Calendar02Icon,
  Tag01Icon,
  Settings01Icon,
  Note01Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";

// UI Components
import { Hero } from "@/components/DebtLoan/Hero";
import {
  CardSelector,
  type FetchState,
  type CardItem,
} from "@/components/Shared/CardSelector";
import { SubmitBar } from "@/components/DebtLoan/SubmitBar";
import {
  SearchablePicker,
  type PickerItem,
} from "@/components/Shared/SearchablePicker";
import { getCategoryIcon, getCategoryGroup } from "@/lib/iconMapping";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface CategoryItem {
  id: string;
  name: string;
}

type FormErrors = Record<string, string>;

// ─── Section Wrapper ───
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── DetailRow ───
function DetailRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  placeholder,
  onClick,
  error,
  children,
  customContent,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  error?: boolean;
  children?: React.ReactNode;
  customContent?: React.ReactNode;
}) {
  const clickable = !!onClick;
  
  const layout = (
    <div
      className={[
        "flex items-center gap-3.5 px-4 py-3.5 min-h-[56px]",
        "transition-colors",
        clickable
          ? "hover:bg-gray-50/60 dark:hover:bg-neutral-800/40 active:bg-gray-100 dark:active:bg-neutral-800"
          : "",
        error ? "bg-red-50/50 dark:bg-red-950/20" : "",
      ].join(" ")}
    >
      <div className={["w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg].join(" ")}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </p>

        {customContent ? (
          <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
            {customContent}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className={[
                "text-[13px] truncate max-w-[140px]",
                value
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-600",
              ].join(" ")}
            >
              {value || placeholder}
            </p>
            {clickable && (
              <svg
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left cursor-pointer">
        {layout}
      </button>
    );
  }
  return <div className="w-full">{layout}</div>;
}

function parseIDRPreview(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export default function AddBillPage() {
  const router = useRouter();
  const toast = useToast();

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null); // name for payees

  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();
  
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  
  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const amount = parseIDRPreview(amountRaw);
  
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [payee, setPayee] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [createExpense, setCreateExpense] = useState(true);
  const [notes, setNotes] = useState("");
  const [cardId, setCardId] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [calOpen, setCalOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const filteredCards = useMemo(() => cards.filter((c) => amount <= 0 || c.balance >= amount), [cards, amount]);

  const loadCards = useCallback(() => {
    setCardsState("loading");
    setCardsError(undefined);
    fetch("/api/cards")
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat daftar rekening");
        return r.json();
      })
      .then((d) => {
        const list = (d.cards ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          balance: c.balance ?? 0,
        }));
        setCards(list);
        setCardsState("success");
      })
      .catch((e) => {
        console.error(e);
        setCardsState("error");
        setCardsError("Gagal memuat rekening.");
      });
  }, []);

  const loadCategories = useCallback(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = d.categories ?? [];
        setCategories(cats);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadCards();
    loadCategories();
  }, [loadCards, loadCategories]);

  useEffect(() => {
    if (filteredCards.length > 0) {
      if (!cardId || !filteredCards.some((c) => c.id === cardId)) {
        setCardId(filteredCards[0].id);
      }
    } else {
      setCardId("");
    }
  }, [filteredCards, cardId]);

  const categoryItems = useMemo<PickerItem[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        group: getCategoryGroup(c.name),
        icon: getCategoryIcon(c.name) as any,
      })),
    [categories]
  );
  
  const selectedCat = categories.find((c) => c.id === categoryId);

  const validate = useCallback(() => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Nama Tagihan wajib diisi";
    if (!amount || amount <= 0) errs.amount = "Nominal harus > 0";
    if (!dueDate) errs.dueDate = "Jatuh tempo wajib diisi";
    if (!categoryId) errs.categoryId = "Kategori wajib dipilih";
    if (!cardId) errs.cardId = "Rekening wajib dipilih";

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.amount) amountInputRef.current?.focus();
      else if (errs.name) nameInputRef.current?.focus();
    }
    return Object.keys(errs).length === 0;
  }, [name, amount, dueDate, categoryId, cardId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      
      setLoading(true);

      const formattedDueDate = dueDate ? format(dueDate, "yyyy-MM-dd") : "";
      const payload = {
        name: name.trim(),
        amount: Number(amount),
        dueDate: formattedDueDate,
        categoryId: categoryId,
        payee: payee.trim() || undefined,
        recurring,
        recurringInterval: recurring ? recurringInterval : undefined,
        createExpense,
        notes: notes.trim() || undefined,
        cardId: cardId,
      };

      try {
        const res = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.show({
            title: "Tagihan Ditambahkan",
            description: `${name} \u00B7 Rp ${amount.toLocaleString("id-ID")}`,
            variant: "success",
            duration: 3500,
          });
          setTimeout(() => router.push("/bills"), 600);
        } else {
          const data = await res.json();
          toast.show({
            title: "Gagal Menyimpan",
            description: data.error || "Terjadi kesalahan",
            variant: "danger",
          });
          setLoading(false);
        }
      } catch {
        toast.show({ title: "Koneksi Error", variant: "danger" });
        setLoading(false);
      }
    },
    [validate, name, amount, dueDate, categoryId, payee, recurring, recurringInterval, notes, cardId, router, toast]
  );

  return (
    <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Tambah Tagihan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/bills")}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 pt-[64px]">
        {/* Hero from DebtLoan */}
        <Hero
          amountRaw={amountRaw}
          onAmountChange={setAmountRaw}
          amountInputRef={amountInputRef}
          amountError={errors.amount}
          
          personName={name}
          onPersonChange={setName}
          personInputRef={nameInputRef}
          personError={errors.name}
          personLabel="Nama Tagihan"
          personPlaceholder="Contoh: Wifi, Listrik"
        />

        <div className="flex-1 px-4 space-y-7 pb-8">
          <CardSelector
            state={cardsState}
            cards={filteredCards}
            amount={0}
            cardId={cardId}
            onSelect={setCardId}
            onRetry={loadCards}
            error={cardsError}
            label="Dibayar Menggunakan"
          />
          {errors.cardId && (
            <p role="alert" className="text-xs text-red-500 -mt-5 px-1">
              {errors.cardId}
            </p>
          )}

          <Section>
            {/* Payee / Biller Name */}
             <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
               <p className="text-[12px] font-semibold text-gray-500 mb-1.5 ml-1 flex items-center">
                 Penerima (Opsional)
               </p>
               <input
                 type="text"
                 value={payee}
                 onChange={(e) => setPayee(e.target.value)}
                 placeholder="Contoh: PLN, PDAM, Netflix"
                 className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 outline-none text-sm placeholder:text-gray-400"
               />
             </div>

            {/* Category using SearchablePicker (Expense Style) */}
            <DetailRow
              icon={<HugeiconsIcon icon={Tag01Icon} size={20} />}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-500 dark:text-blue-400"
              label="Kategori"
              value={selectedCat?.name}
              placeholder="Pilih kategori"
              onClick={() => setCatOpen(true)}
              error={!!errors.categoryId}
            />

            {/* Due Date with Calendar Popover */}
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <div className="w-full">
                  <DetailRow
                    icon={<HugeiconsIcon icon={Calendar02Icon} size={20} />}
                    iconBg="bg-indigo-50 dark:bg-indigo-950/40"
                    iconColor="text-indigo-500 dark:text-indigo-400"
                    label="Jatuh Tempo"
                    value={dueDate ? format(dueDate, "dd MMMM yyyy", { locale: id }) : ""}
                    placeholder="Pilih tanggal"
                    onClick={() => setCalOpen(true)}
                    error={!!errors.dueDate}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent aria-describedby={undefined} className="w-auto p-0 rounded-2xl border-none shadow-xl bg-white dark:bg-neutral-900" align="center">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    setDueDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Recurring Customization */}
            <div className="border-t border-gray-100 dark:border-neutral-800">
              <DetailRow
                icon={<HugeiconsIcon icon={Settings01Icon} size={20} />}
                iconBg="bg-purple-50 dark:bg-purple-950/40"
                iconColor="text-purple-500 dark:text-purple-400"
                label="Tagihan Rutin"
                customContent={
                   <button
                    type="button"
                    onClick={() => setRecurring(!recurring)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${recurring ? "bg-emerald-500" : "bg-gray-200 dark:bg-neutral-700"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${recurring ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                }
              />
            </div>
            
            <AnimatePresence>
              {recurring && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50/50 dark:bg-neutral-900/50"
                >
                  <div className="px-5 py-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Periode</span>
                    <Select value={recurringInterval} onValueChange={(v) => setRecurringInterval(v as any)}>
                      <SelectTrigger className="w-[120px] h-8 text-[13px] font-medium bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Harian</SelectItem>
                        <SelectItem value="WEEKLY">Mingguan</SelectItem>
                        <SelectItem value="MONTHLY">Bulanan</SelectItem>
                        <SelectItem value="YEARLY">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Expense Transaction Toggle */}
            <div className="border-t border-gray-100 dark:border-neutral-800">
              <DetailRow
                icon={<HugeiconsIcon icon={Invoice01Icon} size={20} />}
                iconBg="bg-blue-50 dark:bg-blue-950/40"
                iconColor="text-blue-500 dark:text-blue-400"
                label="Catat sebagai Pengeluaran"
                customContent={
                  <button
                    type="button"
                    onClick={() => setCreateExpense(!createExpense)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${createExpense ? "bg-emerald-500" : "bg-gray-200 dark:bg-neutral-700"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${createExpense ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                }
              />
            </div>
            
            {/* Notes Section */}
            <div className="border-t border-gray-100 dark:border-neutral-800 px-4 py-4">
               <div className="flex items-center gap-2 mb-2 ml-1">
                 <HugeiconsIcon icon={Note01Icon} size={18} className="text-gray-400" />
                 <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">Catatan Tambahan</p>
               </div>
               <textarea
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Opsional: tambahkan keterangan..."
                 className="w-full bg-transparent border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none text-sm placeholder:text-gray-400 resize-none h-20 focus:border-emerald-500"
               />
            </div>
          </Section>
        </div>

        <SubmitBar ready={amount > 0 && name.trim().length > 0 && categoryId.length > 0} loading={loading} label="Simpan Tagihan" />
      </form>

      {/* Expense-style SearchablePicker */}
      <SearchablePicker
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(item) => {
          if (item) setCategoryId(item.id);
        }}
        items={categoryItems}
        selectedId={categoryId}
        title="Pilih Kategori"
        placeholder="Cari kategori..."
        emptyText="Kategori tidak ditemukan."
      />
    </div>
  );
}
