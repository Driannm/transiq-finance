// components/loans/add-loan/LoanSubmitBar.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SubmitBarProps = {
  ready: boolean; // minimum required data present
  loading: boolean;
};

export function SubmitBar({ ready, loading }: SubmitBarProps) {
  const disabled = !ready || loading;

  return (
    <div
      className="sticky bottom-0 left-0 right-0 px-4 pt-3 border-t border-[var(--line,#E7E4DD)] dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <motion.button
        type="submit"
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        aria-busy={loading}
        className={cn(
          "w-full h-13 sm:h-14 rounded-2xl font-semibold text-[15px] transition-colors flex items-center justify-center gap-2",
          !disabled
            ? "bg-[var(--accent,#0E6E4E)] hover:bg-emerald-800 text-white"
            : "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed",
        )}
      >
        {loading && (
          <span
            className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            aria-hidden
          />
        )}
        {loading ? "Menyimpan..." : "Simpan Piutang"}
      </motion.button>
    </div>
  );
}
