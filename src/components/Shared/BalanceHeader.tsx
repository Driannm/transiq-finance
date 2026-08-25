// src/components/Shared/BalanceHeader.tsx
"use client";

import React, { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { format, isValid } from "date-fns";
import { useTheme } from "@/components/Providers/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export type BalanceHeaderVariant =
  | "yellow"
  | "red"
  | "green"
  | "emerald"
  | "rose"
  | "indigo";

export interface BalanceHeaderProps {
  label: string;
  amount: number;
  variant: BalanceHeaderVariant;
  isLoading?: boolean;
  monthSelector?: {
    currentMonth: string; // ISO format "yyyy-MM" or fully formatted string
    onPrev: () => void;
    onNext: () => void;
    style?: "sleek" | "minimal";
  };
  progress?: {
    percentage: number;
    labelLeft?: string;
    labelRight?: string | ReactNode;
  };
  badges?: ReactNode[];
  className?: string;
}

// Map variants to backgrounds and borders
const VARIANT_META = {
  emerald: {
    bg: "radial-gradient(circle at top right, rgba(16, 185, 129, 0.95) 0%, rgba(16, 185, 129, 0.35) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(5, 150, 105, 0.85) 0%, rgba(5, 150, 105, 0.22) 20%, transparent 45%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(16, 185, 129, 0.12), 0 10px 30px rgba(0,0,0,0.45)",
  },
  green: {
    bg: "radial-gradient(circle at top right, rgba(34, 197, 94, 0.95) 0%, rgba(34, 197, 94, 0.35) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(22, 163, 74, 0.85) 0%, rgba(22, 163, 74, 0.22) 20%, transparent 45%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(34, 197, 94, 0.12), 0 10px 30px rgba(0,0,0,0.45)",
  },
  red: {
    bg: "radial-gradient(circle at top right, rgba(220, 38, 38, 0.95) 0%, rgba(220, 38, 38, 0.35) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(185, 28, 28, 0.85) 0%, rgba(185, 28, 28, 0.22) 20%, transparent 45%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(220, 38, 38, 0.12), 0 10px 30px rgba(0,0,0,0.45)",
  },
  yellow: {
    bg: "radial-gradient(circle at top right, rgba(255, 222, 77, 0.85) 0%, rgba(255, 222, 77, 0.30) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(255, 196, 0, 0.70) 0%, rgba(255, 196, 0, 0.18) 22%, transparent 46%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(255,222,77,0.18), 0 10px 30px rgba(0,0,0,0.45)",
  },
  rose: {
    bg: "radial-gradient(circle at top right, rgba(244, 63, 94, 0.95) 0%, rgba(244, 63, 94, 0.35) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(225, 29, 72, 0.85) 0%, rgba(225, 29, 72, 0.22) 20%, transparent 45%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(244, 63, 94, 0.12), 0 10px 30px rgba(0,0,0,0.45)",
  },
  indigo: {
    bg: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.95) 0%, rgba(99, 102, 241, 0.35) 18%, transparent 42%), radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.85) 0%, rgba(79, 70, 229, 0.22) 20%, transparent 45%), linear-gradient(135deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.20), inset -1px 0 0 rgba(99, 102, 241, 0.12), 0 10px 30px rgba(0,0,0,0.45)",
  },
};

const safeFormatDate = (isoStr: string | null | undefined, fmtStr: string) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return isValid(d) ? format(d, fmtStr) : "";
};

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function BalanceHeader({
  label,
  amount,
  variant,
  isLoading = false,
  monthSelector,
  progress,
  badges,
  className = "",
}: BalanceHeaderProps) {
  const meta = VARIANT_META[variant] || VARIANT_META.emerald;

  const formattedMonth = React.useMemo(() => {
    if (!monthSelector?.currentMonth) return "";
    if (
      monthSelector.currentMonth.includes("-") &&
      monthSelector.currentMonth.length === 7
    ) {
      return safeFormatDate(monthSelector.currentMonth + "-01", "MMMM yyyy");
    }
    return monthSelector.currentMonth;
  }, [monthSelector?.currentMonth]);

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] p-6 text-white ${className}`}
      style={{
        background: meta.bg,
        boxShadow: meta.shadow,
      }}
    >
      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Top line: Label & Month Selector */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50 select-none">
            {label}
          </p>

          {monthSelector && (
            <>
              {monthSelector.style === "sleek" ? (
                /* Sleek style (icons with background pill) */
                <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-md border border-white/10 p-0.5 rounded-full select-none">
                  <button
                    onClick={monthSelector.onPrev}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                    type="button"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
                  </button>
                  <span className="text-[10px] font-bold tracking-wide text-white uppercase px-1.5 whitespace-nowrap">
                    {formattedMonth}
                  </span>
                  <button
                    onClick={monthSelector.onNext}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                    type="button"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </button>
                </div>
              ) : (
                /* Minimal style (‹ MMMM yyyy › arrows text-based) */
                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full select-none">
                  <button
                    onClick={monthSelector.onPrev}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold"
                    type="button"
                  >
                    ‹
                  </button>
                  <span className="text-[11px] md:text-xs font-semibold tracking-wide text-white whitespace-nowrap">
                    {formattedMonth}
                  </span>
                  <button
                    onClick={monthSelector.onNext}
                    className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors text-base font-bold"
                    type="button"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Middle level: Amount */}
        <div>
          <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none select-all flex items-baseline">
            <span className="font-sans font-bold text-white/70 select-none mr-2">
              IDR
            </span>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block h-[28px] md:h-[32px] w-[140px] bg-white/20 rounded-xl animate-pulse self-center ml-1"
                />
              ) : (
                <motion.span
                  key="amount"
                  initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  className="flex items-baseline"
                >
                  <span>{formatIDR(amount)}</span>
                  <span className="text-[20px] md:text-[24px] font-mono font-medium opacity-80 select-none">
                    ,00
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </h2>
        </div>

        {/* Progress level */}
        {progress && (
          <div>
            <div className="flex justify-between mb-1.5 select-none">
              {progress.labelLeft && (
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                  {progress.labelLeft}
                </span>
              )}
              {progress.labelRight !== undefined && (
                <span className="text-[10px] font-mono text-white/60">
                  {progress.labelRight}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom level: Badges */}
        {badges && badges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">{badges}</div>
        )}
      </div>
    </div>
  );
}
