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

export function SortSheet({ config, value, onChange, isActive }: SortSheetProps) {
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

  const toggleDirection = useCallback(() => {
    setPending((p) => ({ ...p, direction: p.direction === "asc" ? "desc" : "asc" }));
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-[13px] font-semibold transition-all",
          isActive
            ? "bg-[#6366F1] border-[#6366F1] text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-600"
        )}
      >
        <HugeiconsIcon icon={Sorting01Icon} size={15} />
        <span>Sort</span>
        {isActive && (
          <span className="text-[11px] font-bold opacity-80">
            · {config.fields.find((f) => f.value === value.field)?.label?.split(" ")[0]}
          </span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Sort by">
        {/* Direction toggle */}
        {showDirection && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setPending((p) => ({ ...p, direction: "asc" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
                pending.direction === "asc"
                  ? "bg-[#6366F1] border-[#6366F1] text-white"
                  : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-750"
              )}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
              Ascending
            </button>
            <button
              onClick={() => setPending((p) => ({ ...p, direction: "desc" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
                pending.direction === "desc"
                  ? "bg-[#6366F1] border-[#6366F1] text-white"
                  : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-750"
              )}
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              Descending
            </button>
          </div>
        )}

        {/* Field list */}
        <div className="space-y-1 mb-6 max-h-72 overflow-y-auto">
          {config.fields.map((field) => (
            <button
              key={field.value}
              onClick={() => setPending((p) => ({ ...p, field: field.value }))}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all",
                pending.field === field.value
                  ? "border-[#6366F1] bg-[#6366F1]/5 dark:bg-[#6366F1]/10"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-neutral-800"
              )}
            >
              <div className="flex items-center gap-3">
                {field.icon && (
                  <HugeiconsIcon
                    icon={field.icon}
                    size={16}
                    className={pending.field === field.value ? "text-[#6366F1]" : "text-slate-400 dark:text-neutral-500"}
                  />
                )}
                <div className="text-left">
                  <p className={cn(
                    "text-[14px] font-semibold",
                    pending.field === field.value ? "text-[#6366F1]" : "text-slate-800 dark:text-neutral-200"
                  )}>
                    {field.label}
                  </p>
                  {field.description && (
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">{field.description}</p>
                  )}
                </div>
              </div>
              {pending.field === field.value && (
                <div className="w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
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
            className="flex-1 h-12 rounded-xl font-bold bg-[#6366F1] text-white hover:bg-[#4F46E5]"
          >
            Apply
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}