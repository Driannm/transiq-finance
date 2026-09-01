"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export type PillOption = {
  value: string;
  label: string;
  icon?: any;
};

type PillSelectorProps = {
  label?: string;
  options: PillOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string; // wrapper class
};

export function PillSelector({
  label,
  options,
  value,
  onChange,
  className,
}: PillSelectorProps) {
  return (
    <div className={cn("py-3.5", className)}>
      {label && (
        <p className="text-xs text-[var(--muted,#8A857D)] px-4 mb-2.5">
          {label}
        </p>
      )}
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 pb-0.5 scrollbar-hide"
        role="radiogroup"
        aria-label={label ?? "Select option"}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              layout
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full text-sm font-medium border transition-colors overflow-hidden",
                active
                  ? "bg-[var(--accent-soft,#E7F1EC)] border-[var(--accent,#0E6E4E)]/30 text-[var(--accent,#0E6E4E)] dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                  : "bg-transparent text-neutral-500 dark:text-neutral-400 border-[var(--line,#E7E4DD)] dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {active ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    exit={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="flex items-center justify-center"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  </motion.div>
                ) : opt.icon ? (
                  <motion.div
                    key="icon"
                    initial={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    exit={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="text-gray-400 dark:text-gray-500 flex items-center justify-center"
                  >
                    <HugeiconsIcon icon={opt.icon} size={15} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <motion.span layout="position">{opt.label}</motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
