"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  Home01Icon,
  Car01Icon,
  RiceBowl01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  GiftIcon,
  MoneySavingJarIcon,
} from "@hugeicons/core-free-icons";

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
interface TxGroup {
  id: string;
  name: string;
  icon?: string | null;
}

type ActivePicker = "category" | "merchant" | "group" | null;
type FormErrors = Partial<Record<"name" | "amount" | "cardId", string>>;

function getGroupIcon(iconName?: string | null) {
  switch (iconName) {
    case "home":
      return Home01Icon;
    case "car":
      return Car01Icon;
    case "food":
      return RiceBowl01Icon;
    case "shopping":
      return ShoppingBag01Icon;
    case "general":
      return SparklesIcon;
    case "gift":
      return GiftIcon;
    case "savings":
      return MoneySavingJarIcon;
    default:
      return UserGroupIcon;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

const parseRaw = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;

const formatInput = (n: number) => (n === 0 ? "" : fmt(n));

// ─── Grup baris ───────────────────────────────────────────────────────────────

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

// Baris total (di bawah rincian harga)
function TotalRow({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-neutral-50 px-4 py-3.5 dark:bg-neutral-800/60">
      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Total bayar
      </span>
      <span className="text-[17px] font-bold tabular-nums text-neutral-900 dark:text-white">
        IDR {fmt(total)}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const expenseId = params?.id as string;

  // Ref untuk memindahkan fokus ke kolom pertama yang tidak valid
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Data referensi
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [groups, setGroups] = useState<TxGroup[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();

  // Form
  const [amountRaw, setAmountRaw] = useState("");
  const [name, setName] = useState("");
  const [cardId, setCardId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [fee, setFee] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState("");

  // UI
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Perhitungan
  const subtotal = parseAmount(amountRaw);
  const total = Math.max(0, subtotal + tax + fee + shipping - discount);
  const dateString = date ? format(date, "yyyy-MM-dd") : "";

  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedMer = merchants.find((m) => m.id === merchantId);
  const selectedGrp = groups.find((g) => g.id === groupId);

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

  const groupItems = useMemo<PickerItem[]>(
    () =>
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        group: "Grup Transaksi",
        icon: getGroupIcon(g.icon) as PickerItem["icon"],
      })),
    [groups],
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
      setCardsState("success");
    } catch (e) {
      console.error("Fetch cards error:", e);
      setCardsError("Gagal memuat rekening. Periksa koneksi kamu.");
      setCardsState("error");
    }
  }, []);

  useEffect(() => {
    if (!expenseId) return;

    let live = true;
    loadCards();

    (async () => {
      try {
        const [catRes, merRes, groupRes, expRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/merchant"),
          fetch("/api/transaction-groups"),
          fetch(`/api/expenses/${expenseId}`),
        ]);

        const [catData, merData, groupData, expData] = await Promise.all([
          catRes.json(),
          merRes.json(),
          groupRes.json(),
          expRes.json(),
        ]);

        if (!live) return;

        setCategories(catData.categories ?? []);
        setMerchants(merData.merchants ?? []);
        setGroups(groupData.groups ?? []);

        if (expRes.ok && expData.expense) {
          const e = expData.expense;
          setName(e.name);
          setDate(new Date(e.transaction.date));

          // Subtotal = total - pajak - biaya - ongkir + diskon
          const calculatedSubtotal =
            e.transaction.amount -
            e.tax -
            e.fee -
            (e.shipping ?? 0) +
            e.discount;
          setAmountRaw(String(calculatedSubtotal));

          setDiscount(e.discount);
          setTax(e.tax);
          setFee(e.fee);
          setShipping(e.shipping ?? 0);
          setNotes(e.notes ?? "");
          setCategoryId(e.category?.id ?? "");
          setMerchantId(e.merchant?.id ?? "");
          setCardId(e.transaction.card.id);
          setGroupId(e.transaction.groups?.[0]?.group?.id ?? "");
        } else {
          toast.show({
            title: "Gagal memuat detail expense",
            variant: "danger",
          });
        }
      } catch (err) {
        console.error("Fetch details error:", err);
      } finally {
        if (live) setFetching(false);
      }
    })();

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  // ── Validasi & simpan ───────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!subtotal || subtotal <= 0)
      errs.amount = "Nominal harus lebih besar dari 0";
    if (!name.trim()) errs.name = "Nama pengeluaran wajib diisi";
    if (!cardId) errs.cardId = "Pilih rekening pembayaran";
    setErrors(errs);

    if (errs.amount) amountInputRef.current?.focus();
    else if (errs.name) nameInputRef.current?.focus();

    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Berbeda dengan halaman Tambah: di sini kita menunggu simpan selesai
    // sebelum pindah, supaya halaman detail tidak menampilkan data lama.
    let saved = false;
    try {
      await toast.promise(
        async () => {
          const res = await fetch(`/api/expenses/${expenseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              date: dateString,
              subtotal,
              discount,
              tax,
              fee,
              shipping,
              notes: notes.trim() || null,
              categoryId: categoryId || null,
              merchantId: merchantId || null,
              groupId: groupId || null,
              cardId,
            }),
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(data.error || "Gagal memperbarui expense");
          saved = true;
          return data;
        },
        {
          loading: "Menyimpan perubahan...",
          success: "Expense berhasil diperbarui",
          error: "Gagal memperbarui",
        },
      );
    } catch {
      // Error sudah ditangani toast.promise
    } finally {
      setSubmitting(false);
    }

    if (saved) router.push(`/expenses/${expenseId}`);
  }

  const ready = subtotal > 0 && name.trim().length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <svg
          className="h-8 w-8 animate-spin text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      <div className="fixed left-0 right-0 top-0 z-50">
        <IslandNavbar
          title="Edit Expense"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.push(`/expenses/${expenseId}`)}
          actions={[]}
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
          {/* Sumber dana: Paylater boleh untuk expenses */}
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
          <Group title="Detail">
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

            <PickRow
              label="Grup transaksi"
              value={selectedGrp?.name}
              placeholder="Opsional"
              icon={
                <HugeiconsIcon
                  icon={getGroupIcon(selectedGrp?.icon)}
                  size={16}
                  className="shrink-0 text-teal-500"
                />
              }
              onClick={() => setActivePicker("group")}
            />
          </Group>

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
            <TotalRow total={total} />
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

      <SearchablePicker
        open={activePicker === "group"}
        onClose={() => setActivePicker(null)}
        onSelect={(item) => setGroupId(item?.id ?? "")}
        items={groupItems}
        selectedId={groupId}
        title="Pilih Grup Transaksi"
        placeholder="Cari grup..."
      />
    </div>
  );
}
