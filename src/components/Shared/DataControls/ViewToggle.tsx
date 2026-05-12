// ─────────────────────────────────────────────────────────────────────────────
// ViewToggle — Grid / List / Compact mode switcher
// GroupSheet — Group-by selector
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  GridViewIcon,
  ListViewIcon,
  LayoutLeftIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewConfig, ViewMode, GroupConfig } from "./types";

// ── View Toggle ───────────────────────────────────────────────────────────────

const VIEW_ICONS: Record<ViewMode, IconSvgElement> = {
  grid:    GridViewIcon,
  list:    ListViewIcon,
  compact: LayoutLeftIcon,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  grid:    "Grid",
  list:    "List",
  compact: "Compact",
};

interface ViewToggleProps {
  config: ViewConfig;
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ config, value, onChange, className }: ViewToggleProps) {
  if (config.modes.length < 2) return null;

  return (
    <div className={cn("flex items-center bg-slate-100 dark:bg-neutral-800 rounded-2xl p-1", className)}>
      {config.modes.map((mode) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            title={VIEW_LABELS[mode]}
            className={cn(
              "relative w-9 h-8 rounded-xl flex items-center justify-center transition-colors",
              isActive ? "text-white" : "text-slate-500 dark:text-neutral-400"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="view-active-pill"
                className="absolute inset-0 bg-[#6366F1] rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">
              <HugeiconsIcon icon={VIEW_ICONS[mode]} size={15} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Group Sheet ───────────────────────────────────────────────────────────────

interface GroupSheetProps {
  config: GroupConfig;
  value: string;
  onChange: (v: string) => void;
}

export function GroupSheet({ config, value, onChange }: GroupSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(value);
  const isActive = value !== "none" && !!value;
  const noneLabel = config.noneLabel ?? "No Grouping";

  const handleOpen = useCallback(() => {
    setPending(value);
    setOpen(true);
  }, [value]);

  const handleApply = useCallback(() => {
    onChange(pending);
    setOpen(false);
  }, [pending, onChange]);

  const handleReset = useCallback(() => {
    setPending("none");
    onChange("none");
    setOpen(false);
  }, [onChange]);

  const allOptions = [
    { value: "none", label: noneLabel, icon: undefined },
    ...config.fields,
  ];

  const activeLabel = config.fields.find((f) => f.value === value)?.label;

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-[13px] font-semibold transition-all",
          isActive
            ? "bg-[#6366F1] border-[#6366F1] text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-600"
        )}
      >
        <HugeiconsIcon icon={Layers01Icon} size={15} />
        <span>Group</span>
        {isActive && (
          <span className="text-[11px] font-bold opacity-80">· {activeLabel}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
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
                Group by
              </h3>

              <div className="space-y-1 mb-6">
                {allOptions.map((opt) => {
                  const isSelected = pending === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setPending(opt.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all",
                        isSelected
                          ? "border-[#6366F1] bg-[#6366F1]/5 dark:bg-[#6366F1]/10"
                          : "border-transparent hover:bg-slate-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {opt.icon && (
                          <HugeiconsIcon
                            icon={opt.icon}
                            size={16}
                            className={isSelected ? "text-[#6366F1]" : "text-slate-400 dark:text-neutral-500"}
                          />
                        )}
                        <span className={cn(
                          "text-[14px] font-semibold",
                          isSelected ? "text-[#6366F1]" : "text-slate-800 dark:text-neutral-200"
                        )}>
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}