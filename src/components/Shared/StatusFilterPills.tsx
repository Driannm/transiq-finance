"use client";

import { motion } from "framer-motion";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
  activeBgClass?: string;
  activeTextClass?: string;
  dotClass?: string;
};

export interface StatusFilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  inactiveBgClass?: string;
  className?: string; // For wrapper
}

export function StatusFilterPills<T extends string>({
  options,
  value,
  onChange,
  inactiveBgClass = "bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border-transparent",
  className = "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
}: StatusFilterPillsProps<T>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const isAll = opt.value === "all";

        let finalClasses = "";

        if (isActive) {
          if (isAll && !opt.activeBgClass) {
            finalClasses = "bg-white text-neutral-900 border-white";
          } else {
            finalClasses = `${opt.activeBgClass ?? ""} ${
              opt.activeTextClass ?? ""
            } border-transparent`;
          }
        } else {
          finalClasses = inactiveBgClass;
        }

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${finalClasses}`}
          >
            {opt.label}

            {/* {typeof opt.count === "number" && (
              <span
                className={`ml-0.5 font-mono ${
                  isActive ? "" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {opt.count}
              </span>
            )} */}
          </button>
        );
      })}
    </motion.div>
  );
}
