// components/loans/add-loan/LoanHero.tsx
"use client";

import { RefObject, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatIDRDisplay, formatIDRInput } from "./Format";
import { Skeleton } from "@/components/ui/skeleton";

type HeroProps = {
  amountRaw: string;
  onAmountChange: (raw: string) => void;
  amountInputRef: RefObject<HTMLInputElement | null>;
  amountError?: string;
  disabledAmount?: boolean;
  loading?: boolean;

  personName: string;
  onPersonChange: (val: string) => void;
  personInputRef: RefObject<HTMLInputElement | null>;
  personError?: string;
  personLabel: string;
  personPlaceholder?: string;
};

export function Hero({
  amountRaw,
  onAmountChange,
  amountInputRef,
  amountError,
  disabledAmount = false,
  loading = false,
  personName,
  onPersonChange,
  personInputRef,
  personError,
  personLabel,
  personPlaceholder = "Nama Entitas",
}: HeroProps) {
  const [amountFocused, setAmountFocused] = useState(false);
  const amount = parseIDRPreview(amountRaw);

  return (
    <div className="flex flex-col items-center justify-center pt-10 pb-8 px-6 select-none">
      {/* Amount — the single most important number on the page */}
      <div
        className={cn(
          "flex items-center gap-2 cursor-text min-h-[48px] sm:min-h-[60px]",
          (disabledAmount || loading) && "cursor-default"
        )}
        onClick={() => !disabledAmount && !loading && amountInputRef.current?.focus()}
      >
        <span className="text-2xl font-semibold text-[var(--muted,#8A857D)] leading-none">
          Rp
        </span>
        <div className="relative flex items-center">
          {loading ? (
            <Skeleton className="h-[48px] sm:h-[60px] w-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          ) : (
            <div className="flex items-center animate-fade-in">
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                value={amountRaw}
                onChange={(e) => onAmountChange(formatIDRInput(e.target.value))}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                disabled={disabledAmount}
                className={cn(
                  "absolute inset-0 opacity-0 w-full h-full cursor-text",
                  (disabledAmount || loading) && "cursor-default pointer-events-none"
                )}
                aria-label="Nominal"
                aria-invalid={!!amountError}
              />
              <span
                className={cn(
                   "text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight leading-none transition-colors",
                  amount > 0
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-300 dark:text-neutral-700",
                )}
              >
                {amount > 0 ? formatIDRDisplay(amount) : "0"}
              </span>
              {/* Caret only appears while the field is actually focused — it reflects
                  real input state instead of being permanent decoration. */}
              {amountFocused && !disabledAmount && (
                <span className="ml-1 w-0.5 h-9 sm:h-10 bg-emerald-600 rounded-full animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>
      {amountError && (
        <p role="alert" className="text-xs text-red-500 mt-2">
          {amountError}
        </p>
      )}

      <div className="w-full max-w-[220px] h-px bg-[var(--line,#E7E4DD)] dark:bg-neutral-800 my-6" />

      {/* Person */}
      <div className="w-full max-w-xs relative min-h-[36px]">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)] mb-1.5">
          {personLabel}
        </p>
        {loading ? (
          <Skeleton className="h-8 w-40 mx-auto rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        ) : (
          <div className="relative animate-fade-in w-full text-center">
            <input
              ref={personInputRef}
              type="text"
              value={personName}
              onChange={(e) => onPersonChange(e.target.value)}
              placeholder={personPlaceholder}
              aria-invalid={!!personError}
              className={cn(
                "w-full text-center text-xl sm:text-2xl font-medium bg-transparent border-none outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700",
                personName ? "text-neutral-900 dark:text-white" : "text-neutral-400",
              )}
            />
            {personName && (
              <button
                type="button"
                onClick={() => onPersonChange("")}
                aria-label="Hapus nama"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      {personError && (
        <p role="alert" className="text-xs text-red-500 mt-1.5">
          {personError}
        </p>
      )}
    </div>
  );
}

function parseIDRPreview(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
