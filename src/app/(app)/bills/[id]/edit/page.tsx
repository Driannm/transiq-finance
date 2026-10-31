/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { format } from "date-fns";

import {
  ArrowLeft02Icon,
  Settings01Icon,
  Invoice01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

// UI Components — same as Add Bill page
import { Hero } from "@/components/DebtLoan/Hero";
import {
  CardSelector,
  type FetchState,
  type CardItem,
} from "@/components/Shared/CardSelector";
import { SubmitBar } from "@/components/DebtLoan/SubmitBar";
import { DateRow } from "@/components/Shared/DateRow";
import { PillSelector } from "@/components/Shared/PillSelector";
import {
  SearchablePicker,
  type PickerItem,
} from "@/components/Shared/SearchablePicker";
import {
  getCategoryIcon,
  getCategoryGroup,
  BILL_CATEGORY_OPTIONS,
  type BillCategory,
} from "@/lib/iconMapping";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryItem {
  id: string;
  name: string;
}

type FormErrors = Record<string, string>;

function parseIDRPreview(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const toast = useToast();

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLButtonElement>(null);

  // ── Cards ──────────────────────────────────────────────────────────────────
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();

  // ── Expense categories ─────────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const amount = parseIDRPreview(amountRaw);

  const [dueDate, setDueDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [isFlexible, setIsFlexible] = useState<boolean>(false);
  const [category, setCategory] = useState<BillCategory>("utilities");
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  >("MONTHLY");

  const [createExpense, setCreateExpense] = useState(false);
  const [notes, setNotes] = useState("");
  const [cardId, setCardId] = useState("");

  // ── Page state ─────────────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Filtered cards (afford amount) ─────────────────────────────────────────
  const filteredCards = useMemo(
    () => cards.filter((c) => amount <= 0 || c.balance >= amount),
    [cards, amount],
  );

  // ── Loaders ────────────────────────────────────────────────────────────────
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

  // ── Load bill data ─────────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    setPageLoading(true);

    Promise.all([
      fetch("/api/cards").then((r) => r.json()),
      fetch(`/api/bills/${billId}`).then((r) => {
        if (!r.ok) throw new Error("Gagal memuat detail tagihan");
        return r.json();
      }),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([cardData, billData, catData]) => {
        if (!live) return;

        // Cards
        const list = (cardData.cards ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          balance: c.balance ?? 0,
        }));
        setCards(list);
        setCardsState("success");

        // Categories
        setCategories(catData.categories ?? []);

        // Bill
        const b = billData.bill;
        setName(b.name ?? "");
        setAmountRaw(b.amount > 0 ? String(b.amount) : "");
        setIsFlexible(b.isFlexible ?? false);
        setDueDate(b.dueDate || format(new Date(), "yyyy-MM-dd"));
        setCategory((b.category as BillCategory) || "utilities");
        setRecurring(b.recurring ?? false);
        setCreateExpense(b.createExpense ?? false);
        setNotes(b.notes ?? "");
        setCardId(b.cardId ?? "");
      })
      .catch((e: any) => {
        if (!live) return;
        toast.show({
          title: "Gagal Membuka Halaman",
          description: e.message || "Kesalahan memuat data",
          variant: "danger",
        });
        router.push(`/bills/${billId}`);
      })
      .finally(() => {
        if (live) setPageLoading(false);
      });

    return () => {
      live = false;
    };
  }, [billId]);

  // ── Auto-select card when filtered list changes ────────────────────────────
  useEffect(() => {
    if (filteredCards.length > 0) {
      if (!cardId || !filteredCards.some((c) => c.id === cardId)) {
        setCardId(filteredCards[0].id);
      }
    } else {
      setCardId("");
    }
  }, [filteredCards]);

  // ── Category picker items ──────────────────────────────────────────────────
  const categoryItems = useMemo<PickerItem[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        group: getCategoryGroup(c.name),
        icon: getCategoryIcon(c.name) as any,
      })),
    [categories],
  );

  const selectedCat = categories.find((c) => c.id === categoryId);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Nama Tagihan wajib diisi";
    if (!amount || amount <= 0) errs.amount = "Nominal harus > 0";
    if (!isFlexible && !dueDate) errs.dueDate = "Jatuh tempo wajib diisi";
    if (!cardId) errs.cardId = "Rekening wajib dipilih";
    if (createExpense && !categoryId) {
      errs.categoryId = "Kategori pengeluaran wajib dipilih";
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.amount) amountInputRef.current?.focus();
      else if (errs.name) nameInputRef.current?.focus();
      else if (errs.dueDate) dueDateInputRef.current?.focus();
    }
    return Object.keys(errs).length === 0;
  }, [name, amount, isFlexible, dueDate, cardId, createExpense, categoryId]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSaving(true);

      const payload = {
        name: name.trim(),
        amount: Number(amount),
        isFlexible,
        dueDate: isFlexible ? null : dueDate,
        category,
        categoryId: createExpense ? categoryId : undefined,
        recurring,
        recurringInterval: recurring ? recurringInterval : undefined,
        createExpense,
        notes: notes.trim() || undefined,
        cardId: cardId || undefined,
      };

      try {
        const res = await fetch(`/api/bills/${billId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.show({
            title: "Tagihan Diperbarui",
            description: `${name} · Rp ${amount.toLocaleString("id-ID")}`,
            variant: "success",
            duration: 3500,
          });
          setTimeout(() => router.push(`/bills/${billId}`), 600);
        } else {
          const data = await res.json();
          toast.show({
            title: "Gagal Menyimpan",
            description: data.error || "Terjadi kesalahan",
            variant: "danger",
          });
          setSaving(false);
        }
      } catch {
        toast.show({ title: "Koneksi Error", variant: "danger" });
        setSaving(false);
      }
    },
    [
      validate,
      name,
      amount,
      isFlexible,
      dueDate,
      category,
      categoryId,
      recurring,
      recurringInterval,
      createExpense,
      notes,
      cardId,
      billId,
      router,
      toast,
    ],
  );

  const ready =
    amount > 0 &&
    name.trim().length > 0 &&
    !!cardId &&
    (isFlexible || !!dueDate) &&
    (!createExpense || !!categoryId);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-950">
        <span className="w-9 h-9 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
          Memuat Data Tagihan...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Ubah Tagihan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push(`/bills`)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 pt-[64px]"
      >
        {/* Hero Header — same as Add */}
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
          personPlaceholder="Contoh: Wifi, Listrik, Token"
        />

        <div className="flex-1 px-4 space-y-7 pb-8">
          {/* Card / Payment Source Selector */}
          <div>
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
              <p role="alert" className="text-xs text-red-500 mt-2 px-1">
                {errors.cardId}
              </p>
            )}
          </div>

          {/* Detail & Jadwal Section */}
          <section>
            <div className="flex items-baseline justify-between px-1 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)]">
                Detail &amp; Jadwal
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--line,#E7E4DD)] dark:border-neutral-800 overflow-hidden divide-y divide-[var(--line,#E7E4DD)] dark:divide-neutral-800 bg-white dark:bg-neutral-900/40">
              {/* Kategori Tagihan Row */}
              <PillSelector
                label="Kategori Tagihan"
                options={BILL_CATEGORY_OPTIONS}
                value={category}
                onChange={(v) => setCategory(v as BillCategory)}
              />

              {/* Jenis Jadwal Row */}
              <PillSelector
                label="Jenis Jadwal"
                options={[
                  { value: "scheduled", label: "Jadwal Tetap" },
                  { value: "flexible", label: "Fleksibel / Tanpa Tanggal" },
                ]}
                value={isFlexible ? "flexible" : "scheduled"}
                onChange={(v) => setIsFlexible(v === "flexible")}
              />

              {/* Tanggal Jatuh Tempo Row */}
              {!isFlexible ? (
                <DateRow
                  label="Tanggal Jatuh Tempo"
                  value={dueDate}
                  onChange={setDueDate}
                  triggerRef={dueDateInputRef}
                  error={errors.dueDate}
                  iconClassName="text-amber-500"
                />
              ) : (
                <div className="px-4 py-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <p className="text-xs text-[var(--muted,#8A857D)] leading-relaxed">
                    💡 Tagihan fleksibel tidak memiliki tanggal jatuh tempo
                    tetap. Anda dapat mencatat pembayaran kapan saja tanpa
                    status overdue.
                  </p>
                </div>
              )}

              {/* Tagihan Rutin Toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <HugeiconsIcon
                    icon={Settings01Icon}
                    size={16}
                    className="text-purple-500 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted,#8A857D)]">
                      Tagihan Rutin
                    </p>
                    <p className="text-[15px] font-medium text-neutral-900 dark:text-white mt-0.5">
                      {recurring
                        ? `Berulang (${
                            recurringInterval === "DAILY"
                              ? "Harian"
                              : recurringInterval === "WEEKLY"
                                ? "Mingguan"
                                : recurringInterval === "YEARLY"
                                  ? "Tahunan"
                                  : "Bulanan"
                          })`
                        : "Tidak Berulang"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecurring(!recurring)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${
                    recurring
                      ? "bg-emerald-500"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${
                      recurring ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Recurring Period Selector */}
              {recurring && (
                <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
                  <span className="text-xs text-[var(--muted,#8A857D)] font-medium">
                    Periode Berulang
                  </span>
                  <Select
                    value={recurringInterval}
                    onValueChange={(v) =>
                      setRecurringInterval(
                        v as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
                      )
                    }
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs font-medium">
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
              )}

              {/* Catat sebagai Pengeluaran Toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <HugeiconsIcon
                    icon={Invoice01Icon}
                    size={16}
                    className="text-blue-500 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted,#8A857D)]">
                      Otomatisasi
                    </p>
                    <p className="text-[15px] font-medium text-neutral-900 dark:text-white mt-0.5">
                      Catat sebagai Pengeluaran
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateExpense(!createExpense)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${
                    createExpense
                      ? "bg-emerald-500"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${
                      createExpense ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Expense Category Row */}
              {createExpense && (
                <div className="bg-neutral-50/50 dark:bg-neutral-900/30">
                  <div
                    onClick={() => setCatOpen(true)}
                    className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HugeiconsIcon
                        icon={Tag01Icon}
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--muted,#8A857D)]">
                          Kategori Pengeluaran
                        </p>
                        <p className="text-[15px] font-medium text-neutral-900 dark:text-white mt-0.5">
                          {selectedCat?.name || "Pilih kategori pengeluaran"}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-neutral-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  {errors.categoryId && (
                    <p role="alert" className="text-xs text-red-500 pb-3 px-4">
                      {errors.categoryId}
                    </p>
                  )}
                </div>
              )}

              {/* Catatan Opsional */}
              <div className="px-4 py-3.5">
                <p className="text-xs text-[var(--muted,#8A857D)] mb-1">
                  Catatan Opsional
                </p>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full text-[15px] font-medium bg-transparent border-none outline-none placeholder:text-neutral-300 placeholder:font-normal dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </section>
        </div>

        <SubmitBar ready={ready} loading={saving} label="Simpan Perubahan" />
      </form>

      {/* Category Expense Picker Modal */}
      <SearchablePicker
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(item) => {
          if (item) setCategoryId(item.id);
        }}
        items={categoryItems}
        selectedId={categoryId}
        title="Pilih Kategori Pengeluaran"
        placeholder="Cari kategori pengeluaran..."
        emptyText="Kategori tidak ditemukan."
      />
    </div>
  );
}
