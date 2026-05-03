// ─────────────────────────────────────────────────────────────────────────────
// SearchBar — Animated collapsible search input
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { SearchConfig } from "./types";

interface SearchBarProps {
  config: SearchConfig;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function SearchBar({ config, value, onChange, className }: SearchBarProps) {
  const [expanded, setExpanded] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);
  const collapsible = config.collapsible !== false;

  const handleFocus = useCallback(() => {
    if (collapsible) setExpanded(true);
  }, [collapsible]);

  const handleBlur = useCallback(() => {
    if (collapsible && !value) setExpanded(false);
  }, [collapsible, value]);

  const handleClear = useCallback(() => {
    onChange("");
    if (collapsible) {
      setExpanded(false);
    } else {
      inputRef.current?.focus();
    }
  }, [onChange, collapsible]);

  const handleIconClick = useCallback(() => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // If not collapsible, always expanded
  const isExpanded = !collapsible || expanded || !!value;

  return (
    <motion.div
      className={cn("relative flex items-center", className)}
      animate={{ width: isExpanded ? "100%" : 40 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
    >
      {/* Search icon / trigger */}
      <button
        onClick={handleIconClick}
        className={cn(
          "absolute left-3 z-10 flex items-center justify-center transition-colors",
          isExpanded ? "text-slate-400 dark:text-neutral-500" : "text-slate-600 dark:text-neutral-300"
        )}
        tabIndex={isExpanded ? -1 : 0}
        type="button"
      >
        <HugeiconsIcon icon={Search01Icon} size={16} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={config.placeholder ?? "Search..."}
              className={cn(
                "w-full h-10 pl-9 pr-9 rounded-2xl text-[13px] font-medium",
                "bg-white dark:bg-neutral-800",
                "border border-slate-200 dark:border-neutral-700",
                "text-slate-900 dark:text-neutral-100",
                "placeholder:text-slate-400 dark:placeholder:text-neutral-500",
                "focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]",
                "transition-all"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed: icon-only pill */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer"
          onClick={handleIconClick}
        />
      )}

      {/* Clear button */}
      <AnimatePresence>
        {isExpanded && value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-3 z-10 w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-600 flex items-center justify-center"
            type="button"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={10} className="text-slate-500 dark:text-neutral-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}