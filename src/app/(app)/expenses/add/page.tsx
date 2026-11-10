// src/app/(app)/expenses/add/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  Folder01Icon,
  Folder03Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useConfirm } from "@/hooks/UseConfirm";
import {
  ExpenseTemplatePopover,
  type ExpenseTemplateItem,
} from "@/components/Expenses/ExpensesTemplates";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { Hero } from "@/components/DebtLoan/Hero";
import { SubmitBar } from "@/components/DebtLoan/SubmitBar";
import { parseAmount } from "@/components/DebtLoan/Format";
import {
  CardSelector,
  type FetchState,
  type CardItem,
} from "@/components/Shared/CardSelector";
import {
  SearchablePicker,
  type PickerItem,
} from "@/components/Shared/SearchablePicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getCategoryIcon,
  getMerchantIcon,
  getCategoryGroup,
  getMerchantGroup,
} from "@/lib/iconMapping";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
}
interface Merchant {
  id: string;
  name: string;
}

type ActivePicker = "category" | "merchant" | null;
type FormErrors = Partial<
  Record<"name" | "amount" | "cardId" | "categoryId", string>
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

const parseRaw = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
const formatInput = (n: number) => (n === 0 ? "" : fmt(n));

// ─── UI kecil (gaya sama dengan halaman add lain) ─────────────────────────────

function Group({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {title && (
        <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
          {title}
        </p>
      )}
      <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white dark:divide-neutral-800 dark:bg-neutral-900">
        {children}
      </div>
    </section>
  );
}

const rowCls = "flex w-full items-center justify-between gap-4 px-4 py-3.5";

// Baris yang bisa diketuk (membuka picker)
function PickRow({
  label,
  value,
  placeholder,
  icon,
  onClick,
}: {
  label: string;
  value?: string;
  placeholder: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${rowCls} text-left transition-colors active:bg-neutral-50 dark:active:bg-neutral-800/60`}
    >
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {value && icon}
        <span
          className={`truncate text-[15px] ${
            value
              ? "font-semibold text-neutral-900 dark:text-white"
              : "text-neutral-300 dark:text-neutral-600"
          }`}
        >
          {value || placeholder}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={14}
          className="shrink-0 text-neutral-300 dark:text-neutral-600"
        />
      </span>
    </button>
  );
}

// Baris angka (diskon, pajak, biaya)
function AmountRow({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tone: "plus" | "minus";
}) {
  return (
    <label className={rowCls}>
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span className="flex min-w-0 flex-1 items-baseline justify-end gap-1.5">
        <span className="text-sm text-neutral-400">
          {tone === "minus" ? "−" : "+"} IDR
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatInput(value)}
          placeholder="0"
          onChange={(e) => onChange(parseRaw(e.target.value))}
          // 16px: di bawah itu Safari iOS otomatis zoom saat kolom difokus
          className={`w-28 min-w-0 bg-transparent text-right text-[16px] font-semibold tabular-nums placeholder:text-neutral-300 focus:outline-none dark:placeholder:text-neutral-600 ${
            tone === "minus"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-500 dark:text-red-400"
          }`}
        />
      </span>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddExpensePage() {
  const router = useRouter();
  const toast = useToast();

  // Ref untuk memindahkan fokus ke kolom pertama yang tidak valid
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Data referensi
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [amountRaw, setAmountRaw] = useState("");
  const [name, setName] = useState("");
  const [cardId, setCardId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [fee, setFee] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState("");

  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const confirm = useConfirm();
  const [templates, setTemplates] = useState<ExpenseTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Perhitungan
  const subtotal = parseAmount(amountRaw);
  const total = Math.max(0, subtotal + tax + fee + shipping - discount);
  const dateString = date ? format(date, "yyyy-MM-dd") : "";

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedMer = merchants.find((m) => m.id === merchantId);

  const categoryItems = useMemo<PickerItem[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        group: getCategoryGroup(c.name),
        icon: getCategoryIcon(c.name) as PickerItem["icon"],
      })),
    [categories],
  );

  const merchantItems = useMemo<PickerItem[]>(
    () =>
      merchants.map((m) => ({
        id: m.id,
        name: m.name,
        group: getMerchantGroup(m.name),
        icon: getMerchantIcon(m.name) as PickerItem["icon"],
      })),
    [merchants],
  );

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const loadCards = useCallback(async () => {
    setCardsState("loading");
    setCardsError(undefined);
    try {
      const res = await fetch("/api/cards");
      if (!res.ok) throw new Error("Gagal memuat rekening");
      const data = await res.json();
      const list: CardItem[] = (data.cards ?? []).map(
        (c: CardItem & { balance?: number }) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          balance: c.balance ?? 0,
          stakeholder: c.stakeholder ?? null,
        }),
      );
      setCards(list);
      if (list.length > 0) setCardId((prev) => prev || list[0].id);
      setCardsState("success");
    } catch (e) {
      console.error("Fetch cards error:", e);
      setCardsError("Gagal memuat rekening. Periksa koneksi kamu.");
      setCardsState("error");
    }
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [catRes, merRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/merchant"),
        ]);
        const [catData, merData] = await Promise.all([
          catRes.json(),
          merRes.json(),
        ]);
        if (!live) return;
        setCategories(catData.categories ?? []);
        setMerchants(merData.merchants ?? []);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    })();
    loadCards();
    return () => {
      live = false;
    };
  }, [loadCards]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/expenses/templates");
      if (res.ok) {
        const d = await res.json();
        setTemplates(d.templates ?? []);
      }
    } catch (e) {
      console.error("Fetch templates error:", e);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveAsTemplate = useCallback(
    async (templateName: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/expenses/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateName,
            amount: subtotal,
            categoryId: categoryId || null,
            merchantId: merchantId || null,
            cardId: cardId || null,
            tax,
            fee,
            shipping,
            discount,
            notes: notes || null,
          }),
        });
        if (res.ok) {
          toast.show({
            title: "Template berhasil disimpan",
            variant: "success",
          });
          fetchTemplates();
          return true;
        }
        const d = await res.json();
        toast.show({
          title: "Gagal menyimpan template",
          description: d.error,
          variant: "danger",
        });
        return false;
      } catch {
        toast.show({ title: "Koneksi Error", variant: "danger" });
        return false;
      }
    },
    [
      subtotal,
      categoryId,
      merchantId,
      cardId,
      tax,
      fee,
      shipping,
      discount,
      notes,
      fetchTemplates,
      toast,
    ],
  );

  const handleApplyTemplate = useCallback(
    (t: ExpenseTemplateItem) => {
      setName(t.name);
      setAmountRaw(String(t.amount));
      setCategoryId(t.categoryId ?? "");
      setMerchantId(t.merchantId ?? "");
      if (t.cardId) setCardId(t.cardId);
      setDiscount(t.discount ?? 0);
      setTax(t.tax ?? 0);
      setFee(t.fee ?? 0);
      setShipping(t.shipping ?? 0);
      setNotes(t.notes ?? "");
      toast.show({ title: "Template diterapkan", variant: "success" });
    },
    [toast],
  );

  const handleDeleteTemplate = useCallback(
    (tId: string, tName: string) => {
      confirm({
        title: "Hapus Template?",
        description: `Apakah Anda yakin ingin menghapus template "${tName}"?`,
        confirmLabel: "Hapus",
        cancelLabel: "Batal",
        variant: "danger",
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/expenses/templates/${tId}`, {
              method: "DELETE",
            });
            if (res.ok) {
              toast.show({
                title: "Template berhasil dihapus",
                variant: "success",
              });
              fetchTemplates();
            } else {
              toast.show({
                title: "Gagal menghapus template",
                variant: "danger",
              });
            }
          } catch {
            toast.show({ title: "Koneksi Error", variant: "danger" });
          }
        },
      });
    },
    [confirm, fetchTemplates, toast],
  );

  // ── Validasi & submit ───────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!subtotal || subtotal <= 0)
      errs.amount = "Nominal harus lebih besar dari 0";
    if (!name.trim()) errs.name = "Nama pengeluaran wajib diisi";
    if (!cardId) errs.cardId = "Pilih rekening pembayaran";
    if (!categoryId) errs.categoryId = "Pilih kategori";
    setErrors(errs);

    if (errs.amount) amountInputRef.current?.focus();
    else if (errs.name) nameInputRef.current?.focus();

    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Pindah halaman langsung; toast.promise tetap berjalan karena
    // ToastStore global (tidak ikut hilang saat pindah route).
    router.push("/expenses");

    try {
      await toast.promise(
        async () => {
          const res = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              date: dateString,
              subtotal,
              discount,
              tax,
              fee,
              shipping,
              notes: notes.trim() || undefined,
              categoryId: categoryId || undefined,
              merchantId: merchantId || undefined,
              cardId,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Gagal menyimpan expense");
          return data;
        },
        {
          loading: "Menyimpan...",
          success: "Expense berhasil disimpan",
          error: "Gagal menyimpan",
        },
      );
    } catch {
      // Error sudah ditangani toast.promise
    } finally {
      setSubmitting(false);
    }
  }

  const ready = subtotal > 0 && name.trim().length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="fixed left-0 right-0 top-0 z-50">
        <IslandNavbar
          title="Tambah Expense"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push("/expenses")}
          actions={[
            {
              id: "templates",
              icon: (
                <HugeiconsIcon
                  icon={templatesOpen ? Folder03Icon : Folder01Icon}
                  size={18}
                />
              ),
              onPress: () => setTemplatesOpen((v) => !v),
              label: "Template",
            },
          ]}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col pt-[64px]"
      >
        <Hero
          amountRaw={amountRaw}
          onAmountChange={setAmountRaw}
          amountInputRef={amountInputRef}
          amountError={errors.amount}
          personName={name}
          onPersonChange={setName}
          personInputRef={nameInputRef}
          personError={errors.name}
          personLabel="Untuk"
          personPlaceholder="Nama Pengeluaran"
        />

        <div className="flex-1 space-y-7 px-4 pb-8">
          {/* Sumber dana: Paylater hanya boleh untuk expenses */}
          <div>
            <CardSelector
              state={cardsState}
              cards={cards}
              amount={total}
              cardId={cardId}
              onSelect={setCardId}
              onRetry={loadCards}
              error={cardsError}
              label="Dibayar Dari"
              allowPaylater
            />
            {errors.cardId && (
              <p role="alert" className="mt-1.5 px-1 text-xs text-red-500">
                {errors.cardId}
              </p>
            )}
          </div>

          {/* Detail */}
          <div>
            <Group title="Detail">
              {/* Tanggal */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`${rowCls} text-left transition-colors active:bg-neutral-50 dark:active:bg-neutral-800/60`}
                  >
                    <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
                      Tanggal
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-neutral-900 dark:text-white">
                        {date
                          ? format(date, "dd MMM yyyy", { locale: localeId })
                          : "Pilih tanggal"}
                      </span>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        className="text-neutral-300 dark:text-neutral-600"
                      />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border-0 bg-white p-0 shadow-xl dark:bg-neutral-900"
                  align="end"
                >
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </PopoverContent>
              </Popover>

              <PickRow
                label="Kategori"
                value={selectedCat?.name}
                placeholder="Pilih kategori"
                icon={
                  <HugeiconsIcon
                    icon={getCategoryIcon(selectedCat?.name)}
                    size={16}
                    className="shrink-0 text-blue-500"
                  />
                }
                onClick={() => setActivePicker("category")}
              />

              <PickRow
                label="Merchant"
                value={selectedMer?.name}
                placeholder="Opsional"
                icon={
                  <HugeiconsIcon
                    icon={getMerchantIcon(selectedMer?.name)}
                    size={16}
                    className="shrink-0 text-orange-500"
                  />
                }
                onClick={() => setActivePicker("merchant")}
              />
            </Group>
            {errors.categoryId && (
              <p role="alert" className="mt-1.5 px-1 text-xs text-red-500">
                {errors.categoryId}
              </p>
            )}
          </div>

          {/* Tambahan & potongan + total */}
          <Group title="Tambahan & Potongan">
            <AmountRow
              label="Diskon"
              value={discount}
              onChange={setDiscount}
              tone="minus"
            />
            <AmountRow
              label="Pajak"
              value={tax}
              onChange={setTax}
              tone="plus"
            />
            <AmountRow
              label="Biaya tambahan"
              value={fee}
              onChange={setFee}
              tone="plus"
            />
            <AmountRow
              label="Ongkos kirim"
              value={shipping}
              onChange={setShipping}
              tone="plus"
            />
            <div className="flex items-center justify-between gap-4 bg-neutral-50 px-4 py-3.5 dark:bg-neutral-800/60">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Total bayar
              </span>
              <span className="text-[17px] font-bold tabular-nums text-neutral-900 dark:text-white">
                IDR {fmt(total)}
              </span>
            </div>
          </Group>

          {/* Catatan */}
          <Group title="Catatan (opsional)">
            <div className="px-4 py-3.5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan detail transaksi di sini..."
                rows={3}
                className="w-full resize-none bg-transparent text-[16px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-300 dark:text-neutral-200 dark:placeholder:text-neutral-600"
              />
            </div>
          </Group>
        </div>

        <SubmitBar ready={ready} loading={submitting} />
      </form>

      {/* ── Pickers ── */}
      <SearchablePicker
        open={activePicker === "category"}
        onClose={() => setActivePicker(null)}
        onSelect={(item) => setCategoryId(item?.id ?? "")}
        items={categoryItems}
        selectedId={categoryId}
        title="Pilih Kategori"
        placeholder="Cari kategori..."
      />

      <SearchablePicker
        open={activePicker === "merchant"}
        onClose={() => setActivePicker(null)}
        onSelect={(item) => setMerchantId(item?.id ?? "")}
        items={merchantItems}
        selectedId={merchantId}
        title="Pilih Merchant"
        placeholder="Cari merchant..."
      />

      <ExpenseTemplatePopover
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        anchorId="templates"
        templates={templates}
        loading={loadingTemplates}
        categories={categories}
        canSave={subtotal > 0 && name.trim().length > 0}
        defaultName={name}
        onApply={handleApplyTemplate}
        onSave={handleSaveAsTemplate}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}
