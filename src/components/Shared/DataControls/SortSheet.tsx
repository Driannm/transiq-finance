// ─────────────────────────────────────────────────────────────────────────────
// SortSheet — Bottom sheet for sort configuration
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sorting01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowUpZAIcon,
  ArrowDownAZIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SortConfig, SortState } from "./types";

interface SortSheetProps {
  config: SortConfig;
  value: SortState;
  onChange: (v: SortState) => void;
  /** Active filter count badge */
  isActive?: boolean;
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BottomSheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-t-3xl w-full max-w-md px-6 pt-6 pb-10 shadow-2xl"
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-neutral-700 rounded-full mx-auto mb-5" />
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-neutral-100 text-center mb-6">
              {title}
            </h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SortSheet({
  config,
  value,
  onChange,
  isActive,
}: SortSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<SortState>(value);
  const showDirection = config.showDirection !== false;

  const handleOpen = useCallback(() => {
    setPending(value);
    setOpen(true);
  }, [value]);

  const handleApply = useCallback(() => {
    onChange(pending);
    setOpen(false);
  }, [pending, onChange]);

  const handleReset = useCallback(() => {
    const reset: SortState = {
      field: config.defaultValue ?? config.fields[0]?.value ?? "",
      direction: config.defaultDirection ?? "asc",
    };
    setPending(reset);
    onChange(reset);
    setOpen(false);
  }, [config, onChange]);

  const activeSortLabel =
    config.fields.find((field) => field.value === value.field)?.label ?? "Sort";

  const toggleDirection = useCallback(() => {
    setPending((p) => ({
      ...p,
      direction: p.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-3.5 py-3 rounded-2xl text-[13px] font-semibold transition-colors",
          isActive
            ? "bg-orange-500 text-white shadow-md"
            : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300",
        )}
      >
        <HugeiconsIcon icon={Sorting01Icon} size={15} />

        <div className="relative grid overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isActive ? activeSortLabel : "sort"}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="col-start-1 row-start-1 whitespace-nowrap"
            >
              {isActive ? activeSortLabel : "Sort"}
            </motion.span>
          </AnimatePresence>
        </div>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Sort by">
        {/* Direction toggle */}
        {showDirection && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setPending((p) => ({ ...p, direction: "asc" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold transition-all",
                pending.direction === "asc"
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400",
              )}
            >
              <HugeiconsIcon icon={ArrowUpZAIcon} size={14} />
              Ascending
            </button>
            <button
              onClick={() => setPending((p) => ({ ...p, direction: "desc" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold transition-all",
                pending.direction === "desc"
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400",
              )}
            >
              <HugeiconsIcon icon={ArrowDownAZIcon} size={14} />
              Descending
            </button>
          </div>
        )}

        {/* Field list */}
        <div className="mb-6 max-h-72 overflow-y-auto">
          <div className="divide-y divide-slate-200/80 dark:divide-neutral-800">
            {config.fields.map((field) => {
              const selected = pending.field === field.value;

              return (
                <button
                  key={field.value}
                  onClick={() =>
                    setPending((p) => ({
                      ...p,
                      field: field.value,
                    }))
                  }
                  className={cn(
                    "relative w-full flex items-center justify-between gap-3 px-4 py-3.5",
                    "transition-colors duration-200",
                    "rounded rounded-2xl",
                    selected
                      ? "bg-orange-500/5 dark:bg-orange-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-neutral-800/70",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {field.icon && (
                      <HugeiconsIcon
                        icon={field.icon}
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors duration-200",
                          selected
                            ? "text-orange-500"
                            : "text-slate-400 dark:text-neutral-500",
                        )}
                      />
                    )}

                    <div className="min-w-0 text-left">
                      <p
                        className={cn(
                          "text-[14px] font-semibold transition-colors duration-200",
                          selected
                            ? "text-orange-500"
                            : "text-slate-800 dark:text-neutral-200",
                        )}
                      >
                        {field.label}
                      </p>

                      {field.description && (
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <AnimatePresence initial={false} mode="wait">
                      {selected && (
                        <motion.div
                          key="selected-check"
                          initial={{
                            opacity: 0,
                            scale: 0.5,
                            rotate: -25,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            rotate: 25,
                          }}
                          transition={{
                            duration: 0.18,
                            ease: "easeOut",
                          }}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-orange-500"
                        >
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                          >
                            <path
                              d="M1 4l3 3 5-6"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-0 hover:bg-slate-200 dark:hover:bg-neutral-700"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-12 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600"
          >
            Apply
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
