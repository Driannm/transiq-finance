"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface MonthSelectorProps {
  /** Kelas tambahan untuk wrapper */
  className?: string;
}

export function MonthSelector({ className = "" }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil dari URL atau fallback bulan ini
  const month = searchParams.get("month") ?? format(new Date(), "yyyy-MM");

  const updateMonth = useCallback(
    (newMonth: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", newMonth);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const prevMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() - 1);
    updateMonth(format(d, "yyyy-MM"));
  };

  const nextMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() + 1);
    const newMonth = format(d, "yyyy-MM");
    const currentMonth = format(new Date(), "yyyy-MM");
    // Jangan izinkan bulan depan melebihi bulan sekarang
    if (newMonth <= currentMonth) {
      updateMonth(newMonth);
    }
  };

  const displayText = format(new Date(month + "-01"), "MMMM yyyy");

  return (
    <div
      className={`flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/10 p-0.5 rounded-full select-none ${className}`}
    >
      <button
        onClick={prevMonth}
        className="w-7 h-7 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
        aria-label="Bulan sebelumnya"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
      </button>
      <span className="text-[11px] md:text-xs font-bold tracking-wide text-white uppercase whitespace-nowrap">
        {displayText}
      </span>
      <button
        onClick={nextMonth}
        className="w-7 h-7 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
        aria-label="Bulan berikutnya"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </button>
    </div>
  );
}