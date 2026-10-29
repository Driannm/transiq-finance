"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CancelCircleHalfDotIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { SearchConfig } from "./types";

interface SearchBarProps {
  config: SearchConfig;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

// ─── Animation variants — defined outside component, tidak re-create tiap render

const clearVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export function SearchBar({
  config,
  value,
  onChange,
  className,
}: SearchBarProps) {
  const [expanded, setExpanded] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);
  const collapsible = config.collapsible !== false;
  const isExpanded = !collapsible || expanded || !!value;

  // Fokus (dari tap langsung di input) otomatis membuka kolom
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
      inputRef.current?.blur();
    } else {
      inputRef.current?.focus();
    }
  }, [onChange, collapsible]);

  return (
    // layout="size" — framer menangani perubahan lebar lewat layout animation
    <motion.div
      layout="size"
      className={cn(
        "relative flex items-center h-10 rounded-2xl overflow-hidden",
        "bg-white dark:bg-neutral-900",
        !isExpanded && "cursor-pointer",
        className,
      )}
      style={{ minWidth: 40 }}
      transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
    >
      {/* Ikon cari: hanya hiasan. Tap-nya diterima oleh input di bawahnya. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-3 z-10 flex items-center justify-center",
          "transition-colors duration-150",
          isExpanded
            ? "text-slate-400 dark:text-neutral-500"
            : "text-slate-600 dark:text-neutral-300",
        )}
      >
        <HugeiconsIcon icon={Search01Icon} size={16} />
      </span>

      {/*
        Input SELALU ada di DOM (tidak di-mount/unmount).
        - Ciut: menutupi seluruh tombol secara transparan, jadi tap pertama
          langsung mengenai input asli -> fokus + keyboard terbuka sekali tap.
        - Melebar: tampil normal.
        Sebelumnya input baru dibuat setelah tap pertama, lalu difokuskan lewat
        requestAnimationFrame. iOS/Android menolak fokus yang tidak terjadi
        langsung di dalam sentuhan user, sehingga butuh tap kedua.
      */}
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={config.placeholder ?? "Cari"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={config.placeholder ?? "Cari..."}
        className={cn(
          "h-full bg-transparent outline-none transition-opacity duration-200",
          // 16px di mobile: di bawah itu Safari iOS otomatis zoom saat fokus
          "w-full h-full pl-9 pr-9 bg-transparent",
          "text-[13px] font-medium outline-none",
          "text-slate-900 dark:text-neutral-100",
          "placeholder:text-slate-400 dark:placeholder:text-neutral-500",
          isExpanded
            ? "relative w-full pl-9 pr-9 opacity-100"
            : "absolute inset-0 w-full cursor-pointer pl-9 pr-0 opacity-0",
        )}
      />

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
            aria-label="Hapus teks"
            // Cegah input kehilangan fokus saat tombol disentuh
            onPointerDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className={cn("absolute right-3 z-10")}
          >
            <HugeiconsIcon
              icon={CancelCircleHalfDotIcon}
              size={16}
              className="text-slate-500 dark:text-neutral-400"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
