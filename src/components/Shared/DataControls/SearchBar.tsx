"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants  } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { SearchConfig } from "./types";

interface SearchBarProps {
  config:    SearchConfig;
  value:     string;
  onChange:  (v: string) => void;
  className?: string;
}

// ─── Animation variants — defined outside component, tidak re-create tiap render

const inputVariants: Variants = {
  hidden:  { opacity: 0, scaleX: 0.96 },
  visible: { opacity: 1, scaleX: 1,    transition: { duration: 0.2,  ease: "easeOut" } },
  exit:    { opacity: 0, scaleX: 0.96, transition: { duration: 0.15, ease: "easeIn"  } },
};

const clearVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1,   transition: { duration: 0.15, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.6, transition: { duration: 0.1,  ease: "easeIn"  } },
};

// ─────────────────────────────────────────────────────────────────────────────

export function SearchBar({ config, value, onChange, className }: SearchBarProps) {
  const [expanded, setExpanded] = useState(!!value);
  const inputRef   = useRef<HTMLInputElement>(null);
  const collapsible = config.collapsible !== false;
  const isExpanded  = !collapsible || expanded || !!value;

  const handleFocus = useCallback(() => {
    if (collapsible) setExpanded(true);
  }, [collapsible]);

  const handleBlur = useCallback(() => {
    if (collapsible && !value) setExpanded(false);
  }, [collapsible, value]);

  const handleClear = useCallback(() => {
    onChange("");
    if (collapsible) setExpanded(false);
    else inputRef.current?.focus();
  }, [onChange, collapsible]);

  const handleIconClick = useCallback(() => {
    setExpanded(true);
    // rAF agar focus setelah layout expand selesai
    requestAnimationFrame(() => {
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

  return (
    // layout="size" — framer handles width changes dengan layout animation
    // yang jauh lebih efficient dari animate={{ width }}
    <motion.div
      layout="size"
      className={cn(
        "relative flex items-center h-10 rounded-2xl overflow-hidden",
        "bg-white dark:bg-neutral-900",
        "border border-neutral-300 dark:border-neutral-800",
        !isExpanded && "cursor-pointer",
        className
      )}
      style={{ minWidth: 40 }}
      transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
      onClick={!isExpanded ? handleIconClick : undefined}
    >
      {/* Search icon — selalu ada, tidak re-mount */}
      <motion.button
        type="button"
        onClick={isExpanded ? undefined : handleIconClick}
        tabIndex={isExpanded ? -1 : 0}
        className={cn(
          "absolute left-3 z-10 flex items-center justify-center",
          "transition-colors duration-150",
          isExpanded
            ? "text-slate-400 dark:text-neutral-500 pointer-events-none"
            : "text-slate-600 dark:text-neutral-300"
        )}
        // Tidak pakai whileTap agar tidak ada delay saat tap
      >
        <HugeiconsIcon icon={Search01Icon} size={16} />
      </motion.button>

      {/* Input — mount/unmount dengan AnimatePresence */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.input
            ref={inputRef}
            key="search-input"
            variants={inputVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // layout={false} — jangan ikut layout animation, cukup fade+scale
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={config.placeholder ?? "Search..."}
            style={{ originX: 0 }} // scale dari kiri, natural
            className={cn(
              "w-full h-full pl-9 pr-9 bg-transparent",
              "text-[13px] font-medium outline-none",
              "text-slate-900 dark:text-neutral-100",
              "placeholder:text-slate-400 dark:placeholder:text-neutral-500",
            )}
          />
        )}
      </AnimatePresence>

      {/* Clear button */}
      <AnimatePresence initial={false}>
        {isExpanded && value && (
          <motion.button
            key="clear-btn"
            variants={clearVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className={cn(
              "absolute right-3 z-10",
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
              "bg-slate-200 dark:bg-neutral-900",
              "active:scale-90 transition-transform duration-100"
            )}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={10}
              className="text-slate-500 dark:text-neutral-300"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}