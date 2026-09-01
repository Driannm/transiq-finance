"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  RefreshIcon,
  Alert01Icon,
  Wallet01Icon,
  SmartPhone01Icon,
  CardExchange01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type FetchState = "loading" | "error" | "success" | "idle";

export interface CardItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

const CARD_TYPE_LABELS: Record<string, string> = {
  BANK: "Rekening Bank",
  EWALLET: "E-Wallet",
  EMONEY: "E-Money",
  PAYLATER: "Paylater",
};

function formatIDRDisplay(val: number) {
  return new Intl.NumberFormat("id-ID").format(val);
}

function getCardIcon(type: string) {
  switch (type.toUpperCase()) {
    case "BANK":
      return CreditCardIcon;
    case "EWALLET":
      return SmartPhone01Icon;
    case "EMONEY":
      return CardExchange01Icon;
    default:
      return Wallet01Icon;
  }
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
}: CardSelectorProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const selected = cards.find((c) => c.id === cardId);

  const grouped = {
    BANK: cards.filter((c) => (c.type || "BANK").toUpperCase() === "BANK"),
    EWALLET: cards.filter((c) => (c.type || "").toUpperCase() === "EWALLET"),
    EMONEY: cards.filter((c) => (c.type || "").toUpperCase() === "EMONEY"),
  };

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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

      {state === "success" && cards.length === 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-950/40 bg-amber-50 dark:bg-amber-950/10 px-4 py-3.5">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {amount > 0
              ? `Tidak ada rekening dengan saldo mencukupi (IDR ${formatIDRDisplay(amount)})`
              : "Belum ada rekening yang bisa dipilih"}
          </p>
        </div>
      )}

      {state === "success" && cards.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 px-4 py-3.5 text-left hover:border-gray-200 dark:hover:border-neutral-700 shadow-sm transition-colors"
        >
          <span className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
            <HugeiconsIcon
              icon={getCardIcon(selected?.type || "BANK")}
              size={16}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-gray-900 dark:text-white truncate">
              {selected?.name ?? "Pilih rekening"}
            </span>
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              IDR {formatIDRDisplay(selected?.balance ?? 0)}
            </span>
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="text-gray-300 dark:text-gray-600 flex-shrink-0"
          />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40"
              aria-hidden
            />
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Pilih rekening asal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[61] max-h-[75vh] overflow-y-auto rounded-t-[28px] bg-white dark:bg-neutral-900 shadow-lg pb-[env(safe-area-inset-bottom)]"
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 pt-3 pb-2 px-5 border-b border-gray-100 dark:border-neutral-800">
                <div className="mx-auto h-1 w-9 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-3" />
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Pilih Rekening
                </p>
              </div>

              <div className="px-3 py-2 space-y-2">
                {(Object.entries(grouped) as [string, CardItem[]][]).map(
                  ([groupKey, items]) =>
                    items.length > 0 && (
                      <div key={groupKey} className="mb-2">
                        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">
                          {CARD_TYPE_LABELS[groupKey] || groupKey}
                        </p>
                        {items.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onSelect(c.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                              c.id === cardId
                                ? "bg-emerald-50 dark:bg-emerald-950/30"
                                : "hover:bg-gray-50 dark:hover:bg-neutral-800/60",
                            )}
                          >
                            <HugeiconsIcon
                              icon={getCardIcon(c.type)}
                              size={16}
                              className={cn(
                                "flex-shrink-0",
                                c.id === cardId
                                  ? "text-emerald-500"
                                  : "text-gray-400",
                              )}
                            />
                            <span
                              className={cn(
                                "flex-1 min-w-0 text-[14px] font-semibold truncate",
                                c.id === cardId
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-gray-900 dark:text-white",
                              )}
                            >
                              {c.name}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-mono font-medium flex-shrink-0",
                                c.id === cardId
                                  ? "text-emerald-600 dark:text-emerald-500"
                                  : "text-gray-500",
                              )}
                            >
                              IDR {formatIDRDisplay(c.balance)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ),
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
