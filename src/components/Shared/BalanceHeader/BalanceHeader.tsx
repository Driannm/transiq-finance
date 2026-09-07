"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { formatIDR } from "@/lib/format";
import type { BalanceHeaderProps, BalanceHeaderVariant } from "./types";
import {
  MonthSelector,
  PrivacyToggle,
  TrendIndicator,
  SecondaryAmount,
  ProgressBar,
  Badges,
} from "./addons";

// Map variants to backgrounds and borders
const VARIANT_META: Record<
  BalanceHeaderVariant,
  { bg: string; shadow: string }
> = {
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

export function BalanceHeader({
  label,
  amount,
  variant,
  isLoading = false,
  currency = "IDR",
  monthSelector,
  progress,
  privacyToggle,
  trend,
  secondaryAmount,
  topRightAction,
  badges,
  className = "",
}: BalanceHeaderProps) {
  const meta = VARIANT_META[variant] || VARIANT_META.emerald;
  const isMasked = privacyToggle?.isHidden;
  const maskText = privacyToggle?.maskText || "••••••••";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, margin: "-10px" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden rounded-[24px] p-6 text-white ${className}`}
      style={{
        background: meta.bg,
        boxShadow: meta.shadow,
      }}
    >
      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Top Header Row: Label, Privacy Toggle, Month Selector & Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-white/50 select-none">
              {label}
            </p>
            {privacyToggle && <PrivacyToggle privacyToggle={privacyToggle} />}
          </div>

          <div className="flex items-center gap-2">
            {monthSelector && <MonthSelector monthSelector={monthSelector} />}
            {topRightAction}
          </div>
        </div>

        {/* Amount Level & Trend Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="text-[32px] md:text-[36px] font-mono font-bold tracking-tight leading-none select-all flex items-baseline">
            <span className="font-sans font-bold text-white/70 select-none mr-2">
              {currency}
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              {isLoading ? (
                <motion.span
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="inline-block h-[28px] md:h-[32px] w-[140px] bg-white/20 rounded-xl animate-pulse self-center ml-1"
                />
              ) : isMasked ? (
                <motion.span
                  key="masked"
                  initial={{ opacity: 0, scale: 0.96, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 2 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="tracking-widest font-sans opacity-80 text-[28px]"
                >
                  {maskText}
                </motion.span>
              ) : (
                <motion.span
                  key="amount"
                  initial={{ opacity: 0, scale: 0.96, y: 2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -2 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="flex items-baseline"
                >
                  <span>{formatIDR(Math.abs(amount))}</span>
                  <span className="text-[20px] md:text-[24px] font-mono font-medium opacity-80 select-none">
                    ,00
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </h2>

          {trend && <TrendIndicator trend={trend} />}
        </div>

        {/* Secondary Amount Addon */}
        {secondaryAmount && (
          <SecondaryAmount secondaryAmount={secondaryAmount} />
        )}

        {/* Progress Bar Addon */}
        {progress && <ProgressBar progress={progress} />}

        {/* Bottom Level Badges Addon */}
        {badges && badges.length > 0 && <Badges badges={badges} />}
      </div>
    </motion.div>
  );
}
