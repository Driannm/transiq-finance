"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  RefreshIcon,
  Alert01Icon,
  BitcoinWalletIcon,
  PurseIcon,
  WalletCardsIcon,
  CreditCardIcon,
  Invoice02Icon,
} from "@hugeicons/core-free-icons";
import {
  motion,
  AnimatePresence,
  animate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type FetchState = "loading" | "error" | "success" | "idle";

export interface CardItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  stakeholder?: string | null; // atas nama siapa kartu ini
}

const CARD_TYPE_LABELS: Record<string, string> = {
  BANK: "Rekening Bank",
  EWALLET: "E-Wallet",
  EMONEY: "E-Money",
  PAYLATER: "Paylater",
};

// Urutan grup di drawer
const GROUP_ORDER = ["BANK", "EWALLET", "EMONEY", "PAYLATER"] as const;

function formatIDRDisplay(val: number) {
  return new Intl.NumberFormat("id-ID").format(val);
}

function getCardIcon(type: string) {
  switch (type.toUpperCase()) {
    case "BANK":
      return CreditCardIcon;
    case "EWALLET":
      return PurseIcon;
    case "EMONEY":
      return WalletCardsIcon;
    case "PAYLATER":
      return Invoice02Icon;
    default:
      return BitcoinWalletIcon;
  }
}

// Saldo kartu biasa, limit untuk paylater
function getBalanceLabel(c: CardItem) {
  const prefix = c.type?.toUpperCase() === "PAYLATER" ? "Limit " : "";
  return `${prefix}IDR ${formatIDRDisplay(c.balance)}`;
}

// Angka yang berjalan naik/turun saat nilainya berubah
function AnimatedNumber({
  value,
  prefix = "",
  reduceMotion,
}: {
  value: number;
  prefix?: string;
  reduceMotion?: boolean | null;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduceMotion) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        fromRef.current = v; // kalau terpotong, lanjut dari angka saat ini
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  const shown = display === value ? value : Math.round(display);

  return (
    <span className="shrink-0 whitespace-nowrap tabular-nums">
      {prefix}IDR {formatIDRDisplay(shown)}
    </span>
  );
}

type CardSelectorProps = {
  state: FetchState;
  cards: CardItem[];
  amount?: number; // Optional balance filter indicator logic
  cardId: string;
  onSelect: (id: string) => void;
  onRetry: () => void;
  error?: string;
  label?: string;
  /** Paylater hanya boleh dipilih untuk pengeluaran (expenses). Default: false. */
  allowPaylater?: boolean;
};

export function CardSelector({
  state,
  cards,
  amount = 0,
  cardId,
  onSelect,
  onRetry,
  error,
  label = "Pilih Kartu/Rekening",
  allowPaylater = false,
}: CardSelectorProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Hormati pengaturan "kurangi gerakan" di perangkat user
  const reduceMotion = useReducedMotion();
  const swapDuration = reduceMotion ? 0 : 0.18;

  // Paylater disaring di sini supaya tidak muncul di form selain expenses
  const visibleCards = allowPaylater
    ? cards
    : cards.filter((c) => (c.type || "").toUpperCase() !== "PAYLATER");

  const selected = visibleCards.find((c) => c.id === cardId);
  // Kunci animasi: berubah setiap kali user memilih kartu lain
  const selectedKey = selected?.id ?? "empty";

  const groups = GROUP_ORDER.map((key) => ({
    key,
    items: visibleCards.filter((c) => (c.type || "BANK").toUpperCase() === key),
  })).filter((g) => g.items.length > 0);

  // Arah transisi: mengikuti urutan kartu di drawer
  const flatCards = groups.flatMap((g) => g.items);
  const selectedIndex = flatCards.findIndex((c) => c.id === cardId);
  const [prevIndex, setPrevIndex] = useState(selectedIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (selectedIndex !== prevIndex) {
    setPrevIndex(selectedIndex);
    if (selectedIndex !== -1 && prevIndex !== -1) {
      setDirection(selectedIndex > prevIndex ? 1 : -1);
    }
  }

  // Variants teks: geser + blur tipis. Reduce motion -> hanya fade.
  const swapVariants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (d: number) => ({ opacity: 0, y: d * 10, filter: "blur(4px)" }),
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: (d: number) => ({ opacity: 0, y: d * -10, filter: "blur(4px)" }),
      };

  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Kunci scroll background selama drawer terbuka.
  // Teknik position:fixed dipakai karena `overflow: hidden` saja tidak
  // cukup di iOS Safari. Posisi scroll dikembalikan saat drawer ditutup.
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll"; // jaga lebar scrollbar agar layout tidak geser

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflowY = prev.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 px-1 mb-2">
        {label}
      </p>

      {state === "loading" && (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-neutral-800 px-4 py-4">
          <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-950/40 bg-red-50 dark:bg-red-950/10 px-4 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <HugeiconsIcon
              icon={Alert01Icon}
              size={16}
              className="text-red-500 flex-shrink-0"
            />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium truncate">
              {error || "Gagal memuat rekening"}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 flex-shrink-0"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} />
            Coba lagi
          </button>
        </div>
      )}

      {state === "success" && visibleCards.length === 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-950/40 bg-amber-50 dark:bg-amber-950/10 px-4 py-3.5">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {amount > 0
              ? `Tidak ada rekening dengan saldo mencukupi (IDR ${formatIDRDisplay(amount)})`
              : "Belum ada rekening yang bisa dipilih"}
          </p>
        </div>
      )}

      {state === "success" && visibleCards.length > 0 && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          className="w-full flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 px-4 py-3.5 text-left hover:border-gray-200 dark:hover:border-neutral-700 shadow-sm transition-colors"
        >
          {/* Ikon: crossfade + putar halus */}
          <span className="relative h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex-shrink-0 overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.span
                key={selectedKey}
                initial={
                  reduceMotion ? false : { opacity: 0, scale: 0.6, rotate: -45 }
                }
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 28 }
                }
                className="absolute inset-0 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={getCardIcon(selected?.type || "BANK")}
                  size={16}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </motion.span>
            </AnimatePresence>
          </span>

          {/* Teks: nama, nominal, stakeholder bergerak terpisah */}
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            {/* Nama */}
            <span className="relative block h-[22px] overflow-hidden">
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={direction}
              >
                <motion.span
                  key={selectedKey}
                  custom={direction}
                  variants={swapVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: swapDuration, ease: "easeOut" }}
                  className="block truncate text-[15px] leading-[22px] font-semibold text-gray-900 dark:text-white"
                >
                  {selected?.name ?? "Pilih rekening"}
                </motion.span>
              </AnimatePresence>
            </span>

            {/* Nominal + stakeholder */}
            <span className="relative mt-0.5 flex h-4 items-center overflow-hidden text-xs leading-4 font-medium text-gray-500 dark:text-gray-400">
              <AnimatedNumber
                value={selected?.balance ?? 0}
                prefix={
                  selected?.type?.toUpperCase() === "PAYLATER" ? "Limit " : ""
                }
                reduceMotion={reduceMotion}
              />
              <AnimatePresence mode="popLayout" initial={false}>
                {selected?.stakeholder && (
                  <motion.span
                    key={selectedKey}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: swapDuration,
                      delay: reduceMotion ? 0 : 0.06,
                      ease: "easeOut",
                    }}
                    className="ml-1 truncate text-gray-400 dark:text-gray-500"
                  >
                    - {selected.stakeholder}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </span>

          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="text-gray-300 dark:text-gray-600 flex-shrink-0"
          />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 touch-none"
              aria-hidden
            />
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[61] flex max-h-[75vh] flex-col rounded-t-[28px] bg-white dark:bg-neutral-900 shadow-lg"
            >
              {/* Header tetap di atas, tidak ikut scroll */}
              <div className="shrink-0 pt-3 pb-2 px-5 border-b border-gray-200 dark:border-neutral-700">
                <div className="mx-auto h-1 w-9 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-3" />
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Pilih Rekening
                </p>
              </div>

              {/* Hanya area ini yang bisa di-scroll */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] space-y-3">
                {groups.map(({ key, items }, groupIndex) => (
                  <motion.div
                    key={key}
                    // Grup muncul bergantian dengan jeda singkat
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: reduceMotion ? 0 : 0.08 + groupIndex * 0.05,
                      ease: "easeOut",
                    }}
                    className="overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-700"
                  >
                    {/* Header grup */}
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-neutral-800 px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                        {CARD_TYPE_LABELS[key] || key}
                      </p>
                      <span className="text-[10px] font-mono font-semibold text-gray-400 dark:text-gray-500">
                        {items.length}
                      </span>
                    </div>

                    {/* Item dipisah garis yang jelas */}
                    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                      {items.map((c) => {
                        const isSelected = c.id === cardId;
                        return (
                          <motion.button
                            key={c.id}
                            type="button"
                            whileTap={
                              reduceMotion ? undefined : { scale: 0.98 }
                            }
                            onClick={() => {
                              onSelect(c.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : "bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800/60",
                            )}
                          >
                            <HugeiconsIcon
                              icon={getCardIcon(c.type)}
                              size={16}
                              className={cn(
                                "flex-shrink-0",
                                isSelected
                                  ? "text-emerald-500"
                                  : "text-gray-400",
                              )}
                            />
                            <span className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  "block text-[14px] font-semibold truncate",
                                  isSelected
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-gray-900 dark:text-white",
                                )}
                              >
                                {c.name}
                              </span>
                              {c.stakeholder && (
                                <span className="block text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  a.n. {c.stakeholder}
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-mono font-medium flex-shrink-0",
                                isSelected
                                  ? "text-emerald-600 dark:text-emerald-500"
                                  : "text-gray-500",
                              )}
                            >
                              {getBalanceLabel(c)}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
