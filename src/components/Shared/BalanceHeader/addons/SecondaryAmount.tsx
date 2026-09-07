"use client";

import React from "react";
import { formatIDR } from "@/lib/format";
import type { SecondaryAmountConfig } from "../types";

export function SecondaryAmount({
  secondaryAmount,
}: {
  secondaryAmount: SecondaryAmountConfig;
}) {
  const currency = secondaryAmount.currency || "IDR";
  const typeColor =
    secondaryAmount.type === "positive"
      ? "text-emerald-300"
      : secondaryAmount.type === "negative"
        ? "text-rose-300"
        : "text-white/80";

  return (
    <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
      <span className="text-white/60 font-medium">{secondaryAmount.label}:</span>
      <span className={`font-mono font-semibold tracking-tight ${typeColor}`}>
        <span className="font-sans text-[10px] font-bold mr-1 opacity-80">
          {currency}
        </span>
        {formatIDR(Math.abs(secondaryAmount.amount))}
      </span>
    </div>
  );
}
