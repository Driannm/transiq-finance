/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { z } from "zod";
import { useToast } from "@/hooks/UseToast";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "@/lib/format";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Wallet01Icon,
  Calendar02Icon,
  Tag01Icon,
  Store01Icon,
  Note01Icon,
  Invoice01Icon,
  Add01Icon,
  MinusSignCircleIcon,
  PercentCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  SearchablePicker,
  type PickerItem,
} from "@/components/Shared/SearchablePicker";
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
  type?: string;
}
interface Merchant {
  id: string;
  name: string;
  type?: string;
}
interface Card {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

type ActivePicker = "category" | "merchant" | null;

// ─── Schema ───────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  name: z.string().min(1, "Nama expense wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  subtotal: z.number().positive("Minimal Rp 1"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));
const fmtFull = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.round(n));
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const CARD_COLORS: Record<string, { bg: string; text: string; ring: string }> =
  {
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

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2 px-1">
      {children}
    </p>
  );
}

// ─── BreakdownRow ─────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  onChange,
  variant = "neutral",
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  variant?: "neutral" | "positive" | "negative";
  icon?: React.ReactNode;
}) {
  const color =
    variant === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : variant === "negative"
      ? "text-red-500 dark:text-red-400"
      : "text-gray-700 dark:text-gray-300";

  const borderColor =
    variant === "positive"
      ? "focus-within:border-emerald-400 dark:focus-within:border-emerald-600"
      : variant === "negative"
      ? "focus-within:border-red-400 dark:focus-within:border-red-600"
      : "focus-within:border-gray-400 dark:focus-within:border-neutral-600";

  const parseRaw = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
  const formatInput = (n: number) =>
    n === 0 ? "" : new Intl.NumberFormat("id-ID").format(n);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <span className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex items-center justify-center">
          {icon}
        </span>
        <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <div
        className={[
          "flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors",
          "bg-gray-50/60 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700",
          borderColor,
        ].join(" ")}
      >
        <span className="text-[13px] text-gray-400 dark:text-gray-500 select-none">
          Rp
        </span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formatInput(value)}
          placeholder="0"
          onChange={(e) => onChange(parseRaw(e.target.value))}
          className={[
            "w-[90px] text-right bg-transparent text-[14px] font-semibold outline-none tabular-nums",
            "placeholder-gray-400 dark:placeholder-gray-600",
            color,
          ].join(" ")}
        />
      </div>
    </div>
  );
}

// ─── MetaChip ─────────────────────────────────────────────────────────────────

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
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  error?: boolean;
  children?: React.ReactNode; // For hidden native inputs (date)
}) {
  const clickable = !!onClick;
  const Wrapper = clickable ? motion.button : "div";
  const wrapperProps = clickable
    ? {
        type: "button" as const,
        onClick,
        whileTap: { scale: 0.98 },
        className: "w-full text-left cursor-pointer",
      }
    : { className: "w-full" };

  return (
    <Wrapper {...wrapperProps}>
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
        {/* Icon */}
        <div
          className={[
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg,
          ].join(" ")}
        >
          <span className={iconColor}>{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </p>

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
        </div>

        {/* Hidden native inputs (date picker overlay) */}
        {children}
      </div>
    </Wrapper>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  icon,
  title,
  badge,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Section className="mx-4 mb-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
            {icon}
          </span>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-gray-100 dark:border-neutral-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddExpensePage() {
  const router = useRouter();
  const toast = useToast();

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Form
  const [name, setName] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const parseRaw = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
  const formatInput = (n: number) =>
    n === 0 ? "" : new Intl.NumberFormat("id-ID").format(n);

  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [fee, setFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [cardId, setCardId] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  // Computed
  const subtotal = amount;
  const total = Math.max(0, subtotal + tax + fee - discount);
  const hasBreakdown = discount > 0 || tax > 0 || fee > 0;
  const selectedCat = categories.find((c) => c.id === categoryId);
  const selectedMer = merchants.find((m) => m.id === merchantId);

  // ── Convert to PickerItem — memo ────────────────────────────────────────────
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

  const merchantItems = useMemo<PickerItem[]>(
    () =>
      merchants.map((m) => ({
        id: m.id,
        name: m.name,
        group: getMerchantGroup(m.name),
        icon: getMerchantIcon(m.name) as any,
      })),
    [merchants]
  );

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [catRes, merRes, cardRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/merchant"),
          fetch("/api/cards"),
        ]);
        const [catData, merData, cardData] = await Promise.all([
          catRes.json(),
          merRes.json(),
          cardRes.json(),
        ]);
        if (!live) return;
        setCategories(catData.categories ?? []);
        setMerchants(merData.merchants ?? []);
        const list: Card[] = cardData.cards ?? [];
        setCards(list);
        if (list.length > 0) setCardId(list[0].id);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setErrors({});
    const payload = {
      name,
      date,
      subtotal,
      discount,
      tax,
      fee,
      notes: notes || undefined,
      categoryId: categoryId || undefined,
      merchantId: merchantId || undefined,
      cardId,
    };
    const parsed = expenseSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) e[i.path[0] as string] = i.message;
      });
      setErrors(e);
      toast.show({ title: "Form tidak valid", variant: "danger" });
      return;
    }
    if (!cardId) {
      setErrors({ cardId: "Pilih kartu pembayaran" });
      toast.show({ title: "Pilih kartu dulu", variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.show({
          title: "Expense disimpan",
          description: `${name} \u00B7 ${fmtFull(total)}`,
          variant: "success",
          icon: (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={22}
              color="white"
            />
          ),
          iconBg: "bg-emerald-500",
          duration: 4000,
        });
        setTimeout(() => router.push("/expenses"), 600);
      } else {
        const data = await res.json();
        toast.show({
          title: "Gagal menyimpan",
          description: data.error,
          variant: "danger",
        });
      }
    } catch {
      toast.show({ title: "Koneksi error", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [
    name,
    date,
    subtotal,
    discount,
    tax,
    fee,
    notes,
    categoryId,
    merchantId,
    cardId,
    total,
    toast,
    router,
  ]);

  const handleBack = () => {
    router.push("/expenses");
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <IslandNavbar
        title="Tambah Expense"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={20} />}
        onAvatarPress={handleBack}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* ── Hero: Amount input ── */}
        <div className="mx-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-6 pt-5 pb-6 mb-4">
          <SectionLabel>Total Pengeluaran</SectionLabel>
          <div className="flex items-baseline gap-2.5">
            <span className="text-lg font-semibold text-gray-400 dark:text-gray-500 select-none">
              Rp
            </span>
            <input
              type="number"
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
          {hasBreakdown && (
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1 tabular-nums">
              = {formatRupiah(total)}
            </p>
          )}
          {errors.subtotal && (
            <p className="text-xs text-red-500 mt-2">{errors.subtotal}</p>
          )}
        </div>

        {/* ── Transaction Name ── */}
        <div className="mx-4 mb-3">
          <SectionLabel>Nama Transaksi</SectionLabel>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 dark:focus-within:border-blue-600 transition-all">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Makan Siang, Bensin, Belanja..."
              className="w-full bg-transparent text-[15px] font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 mt-1.5 px-1">{errors.name}</p>
          )}
        </div>

        {/* ── Card selector ── */}
        <div className="mx-4 mb-3">
          <SectionLabel>Kartu Pembayaran</SectionLabel>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 p-2">
            {cards.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <HugeiconsIcon
                  icon={Wallet01Icon}
                  size={18}
                  className="text-gray-300"
                />
                <span>Tidak ada kartu tersedia</span>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {cards.map((card) => {
                  const selected = card.id === cardId;
                  const colors = CARD_COLORS[card.type] ?? CARD_COLORS.BANK;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setCardId(card.id)}
                      className={[
                        "flex-shrink-0 flex items-center gap-3 px-4 py-3.5 rounded-full text-left",
                        "border-2 transition-all duration-200 min-w-[140px]",
                        selected
                          ? `${colors.bg} ${colors.ring} shadow-sm`
                          : "border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 bg-transparent",
                        "active:scale-[0.97]",
                      ].join(" ")}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? colors.bg
                            : "bg-gray-50 dark:bg-neutral-800"
                        }`}
                      >
                        <HugeiconsIcon
                          icon={Wallet01Icon}
                          size={17}
                          className={
                            selected
                              ? colors.text
                              : "text-gray-400 dark:text-gray-500"
                          }
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-[13px] font-semibold truncate ${
                            selected
                              ? colors.text
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {card.name}
                        </p>
                        {card.balance !== undefined && (
                          <p className="text-[11px] text-gray-400 tabular-nums mt-0.5">
                            {fmtFull(card.balance)}
                          </p>
                        )}
                      </div>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-4 h-4 rounded-full ${colors.text} border-2 ${colors.bg} flex items-center justify-center flex-shrink-0 ml-auto`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${colors.text.replace(
                              "text-",
                              "bg-"
                            )}`}
                          />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.cardId && (
              <p className="text-xs text-red-500 px-3 pt-2 pb-1">
                {errors.cardId}
              </p>
            )}
          </div>
        </div>

        <div className="mx-4 mb-3">
          <SectionLabel>Detail Transaksi</SectionLabel>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100/80 dark:border-neutral-800/80 overflow-hidden">
            {/* Date Row */}
            <label className="block relative cursor-pointer">
              <DetailRow
                icon={<HugeiconsIcon icon={Calendar02Icon} size={18} />}
                iconBg="bg-blue-50 dark:bg-blue-950/40"
                iconColor="text-blue-500 dark:text-blue-400"
                label="Tanggal"
                value={fmtDate(date)}
              >
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </DetailRow>
            </label>

            {/* Divider */}
            <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />

            {/* Category Row */}
            <DetailRow
              icon={<HugeiconsIcon icon={Tag01Icon} size={18} />}
              iconBg="bg-violet-50 dark:bg-violet-950/40"
              iconColor="text-violet-500 dark:text-violet-400"
              label="Kategori"
              value={selectedCat?.name}
              placeholder="Pilih kategori"
              onClick={() => setActivePicker("category")}
            />

            {/* Divider */}
            <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />

            {/* Merchant Row */}
            <DetailRow
              icon={<HugeiconsIcon icon={Store01Icon} size={18} />}
              iconBg="bg-orange-50 dark:bg-orange-950/40"
              iconColor="text-orange-500 dark:text-orange-400"
              label="Merchant"
              value={selectedMer?.name}
              placeholder="Pilih merchant"
              onClick={() => setActivePicker("merchant")}
            />
          </div>
        </div>

        {/* ── Breakdown collapsible ── */}
        <CollapsibleSection
          icon={<HugeiconsIcon icon={Invoice01Icon} size={17} />}
          title="Rincian Harga"
          badge={
            hasBreakdown ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                Aktif
              </span>
            ) : undefined
          }
          subtitle={
            hasBreakdown
              ? `Total: ${fmtFull(total)}`
              : "Tambah diskon, pajak & biaya"
          }
          isOpen={showBreakdown}
          onToggle={() => setShowBreakdown((v) => !v)}
        >
          <div className="pt-3 space-y-0 divide-y divide-gray-50 dark:divide-neutral-800">
            <BreakdownRow
              label="Diskon"
              value={discount}
              onChange={setDiscount}
              variant="positive"
              icon={
                <HugeiconsIcon
                  icon={Tag01Icon}
                  size={15}
                  className="text-emerald-500"
                />
              }
            />
            <BreakdownRow
              label="Pajak"
              value={tax}
              onChange={setTax}
              variant="negative"
              icon={
                <HugeiconsIcon
                  icon={PercentCircleIcon}
                  size={15}
                  className="text-red-400"
                />
              }
            />
            <BreakdownRow
              label="Biaya Tambahan"
              value={fee}
              onChange={setFee}
              variant="negative"
              icon={
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={15}
                  className="text-orange-400"
                />
              }
            />
          </div>
        </CollapsibleSection>

        {/* ── Notes collapsible ── */}
        <CollapsibleSection
          icon={<HugeiconsIcon icon={Note01Icon} size={17} />}
          title={notes ? "Catatan" : "Tambah Catatan"}
          subtitle={notes || "Deskripsi tambahan..."}
          isOpen={showNotes}
          onToggle={() => setShowNotes((v) => !v)}
        >
          <div className="pt-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis catatan di sini..."
              rows={3}
              autoFocus={showNotes}
              className="w-full bg-transparent text-[14px] text-gray-700 dark:text-gray-300 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed"
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* ── Sticky submit ── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#F5F5F7] dark:from-neutral-950 via-[#F5F5F7]/95 dark:via-neutral-950/95 to-transparent z-10">
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={loading || total === 0 || !name.trim()}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          className={[
            "w-full h-[52px] rounded-2xl font-semibold text-[15px] tracking-wide transition-all duration-200",
            "flex items-center justify-center gap-2",
            loading || total === 0 || !name.trim()
              ? "bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-gray-900/15 dark:shadow-white/10 active:shadow-md",
          ].join(" ")}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Menyimpan...
            </span>
          ) : total === 0 ? (
            "Masukkan nominal"
          ) : !name.trim() ? (
            "Isi nama transaksi"
          ) : (
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
              Simpan {fmtFull(total)}
            </span>
          )}
        </motion.button>
      </div>

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
    </div>
  );
}
