// src/components/Shared/ConfirmDialog.tsx
"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmStore, type ConfirmVariant } from "@/store/ConfirmStore";

// ─── Icon defaults per variant ────────────────────────────────────────────────

function DefaultIcon({ variant }: { variant: ConfirmVariant }) {
  if (variant === "danger") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ConfirmVariant, { icon: string; confirm: string }> = {
  danger: {
    icon:    "bg-red-50 dark:bg-red-950/40 text-red-500",
    confirm: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30",
  },
  warning: {
    icon:    "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
    confirm: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  safe: {
    icon:    "bg-green-50 dark:bg-green-950/40 text-green-600",
    confirm: "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30",
  },
};

// ─── Animation Variants (Optimized: transform + opacity only) ────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.15, ease: "easeOut" } as const 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.12, ease: "easeIn" } as const 
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30, 
      mass: 0.6,
      delay: 0.05,
    } as const
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    y: 4,
    transition: { duration: 0.12, ease: "easeIn" } as const 
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 6 },
  // For function variants, explicitly return the object
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.04, duration: 0.15, ease: "easeOut" } as const
  }),
};

const buttonVariants = {
  hover: { scale: 1.02, transition: { duration: 0.1 } },
  tap: { scale: 0.98, transition: { duration: 0.08 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog() {
  const { isOpen, options, isLoading, close, setLoading } = useConfirmStore();

  const variant  = options?.variant ?? "danger";
  const styles   = VARIANT_STYLES[variant];

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !isLoading) close();
  }, [isLoading, close]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !options) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await options.onConfirm();
    } finally {
      close();
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    options.onCancel?.();
    close();
  };

  return (
    <AnimatePresence>
      {/* Backdrop - Fade only (GPU accelerated) */}
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        onClick={handleCancel}
        style={{ willChange: "opacity" }}
      >
        {/* Overlay - static blur, no animation */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" />

        {/* Modal - Scale + Slide + Fade (transform only) */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-10 w-full max-w-[320px] bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-xl dark:shadow-none"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby={options.description ? "confirm-desc" : undefined}
          style={{ willChange: "transform, opacity" }}
        >
          {/* Body */}
          <div className="p-5">
            <div className="flex items-start gap-3.5">
              {/* Icon - Staggered fade + slide */}
              <motion.div
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}
              >
                {options.icon ?? <DefaultIcon variant={variant} />}
              </motion.div>

              {/* Text - Staggered fade + slide */}
              <motion.div 
                custom={1}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 pt-0.5 min-w-0"
              >
                <p id="confirm-title" className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1.5">
                  {options.title}
                </p>
                {options.description && (
                  <p id="confirm-desc" className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {options.description}
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Footer - Staggered buttons */}
          <motion.div 
            custom={2}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="flex border-t border-gray-100 dark:border-neutral-800"
          >
            {/* Cancel Button */}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-3.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-r border-gray-100 dark:border-neutral-800 disabled:opacity-40"
            >
              {options.cancelLabel ?? "Batal"}
            </motion.button>

            {/* Confirm Button */}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${styles.confirm}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Memproses...
                </>
              ) : (
                options.confirmLabel ?? "Konfirmasi"
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}