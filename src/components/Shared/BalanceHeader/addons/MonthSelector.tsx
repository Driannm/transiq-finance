"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { safeDate } from "@/lib/format";
import type { MonthSelectorConfig } from "../types";

export function MonthSelector({
  monthSelector,
}: {
  monthSelector: MonthSelectorConfig;
}) {
  const formattedMonth = React.useMemo(() => {
    if (!monthSelector?.currentMonth) return "";
    if (
      monthSelector.currentMonth.includes("-") &&
      monthSelector.currentMonth.length === 7
    ) {
      return safeDate(monthSelector.currentMonth + "-01", "MMMM yyyy", "");
    }
    return monthSelector.currentMonth;
  }, [monthSelector?.currentMonth]);

  if (monthSelector.style === "sleek") {
    return (
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
    );
  }

  return (
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
  );
}
