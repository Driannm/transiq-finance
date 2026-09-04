// src/components/Shared/ToastCard.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from "@/store/ToastStore";

// ─── Spinner (loading state) ──────────────────────────────────────────────────

const SpinnerIcon = () => (
  <motion.svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
  >
    <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
    <path d="M12 3a9 9 0 0 1 9 9" strokeOpacity={1} />
  </motion.svg>
);

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  default: "bg-neutral-700",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
};

const VARIANT_DEFAULT_ICON: Record<ToastVariant, ReactNode> = {
  default: (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="16" r="0.8" fill="white" />
    </svg>
  ),
  success: (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.8"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.8" fill="white" />
    </svg>
  ),
  danger: (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.8" fill="white" />
    </svg>
  ),
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const duration  = toast.duration ?? 3500;
  const variant   = toast.variant  ?? "default";
  const status    = toast.status   ?? "idle";
  const isLoading = status === "loading";
  const iconBg    = toast.iconBg   ?? VARIANT_ICON_BG[variant];
  const isTop     = (toast.position ?? "top") === "top";

  const resolvedIcon = isLoading
    ? <SpinnerIcon />
    : (toast.icon ?? VARIANT_DEFAULT_ICON[variant]);

  // ── Auto-dismiss lifecycle ──
  useEffect(() => {
    if (isLoading || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [isLoading, duration, onDismiss]);

  const handleActionPress = () => {
    if (isLoading) return;
    toast.action?.onPress?.();
    onDismiss();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onDismiss();
    }
  };

  // ── Animation: Scale Pop ──
  // Reduced-motion: simple fade only
  const cardInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { y: isTop ? -16 : 16, opacity: 0, scale: 0.88 };

  const cardAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { y: 0, opacity: 1, scale: 1 };

  const cardExit = prefersReducedMotion
    ? { opacity: 0 }
    : {
        scale: 0.82,
        opacity: 0,
        y: isTop ? -8 : 8,
        transition: { duration: 0.18, ease: [0.4, 0, 0.6, 1] as const },
      };

  const cardTransition = prefersReducedMotion
    ? { duration: 0.15, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 520, damping: 26, mass: 0.75 };

  // ── Icon pop ──
  const iconInitial = prefersReducedMotion ? { opacity: 0 } : { scale: 0.6, rotate: -12 };
  const iconAnimate = prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 };
  const iconTransition = prefersReducedMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 450, damping: 22 };

  return (
    <motion.div
      layout
      initial={cardInitial}
      animate={cardAnimate}
      exit={cardExit}
      transition={cardTransition}
      onKeyDown={handleKeyDown}
      className={`
        relative flex items-center gap-2.5 w-full max-w-xs mx-auto
        bg-neutral-900/95 dark:bg-neutral-800/95
        rounded-[32px] pl-3 pr-7 py-2.5
        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]
        border border-white/[0.08]
        backdrop-blur-xl
        overflow-hidden
        pointer-events-auto
      `}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Icon */}
      <motion.div
        key={status}
        className={`w-11 h-11 rounded-3xl flex-shrink-0 flex items-center justify-center ${iconBg}`}
        initial={iconInitial}
        animate={iconAnimate}
        transition={iconTransition}
      >
        {resolvedIcon}
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[11.5px] text-white/60 leading-snug mt-0.5 line-clamp-2">
            {toast.description}
          </p>
        )}
      </div>

      {/* Action button */}
      {toast.action && (
        <button
          type="button"
          onClick={handleActionPress}
          disabled={isLoading}
          aria-label={toast.action.label ?? "Toast action"}
          className="flex items-center gap-1 flex-shrink-0 rounded-md px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40"
        >
          {toast.action.label && (
            <span className="text-[13px] font-medium text-white/70">
              {toast.action.label}
            </span>
          )}
          <motion.svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="opacity-50"
            whileHover={prefersReducedMotion ? undefined : { x: 3 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <path d="M9 18l6-6-6-6" />
          </motion.svg>
        </button>
      )}

      {/* Progress bar — visual only */}
      {duration > 0 && !isLoading &&
        (prefersReducedMotion ? (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10" />
        ) : (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            style={{ originX: 0 }}
          />
        ))}
    </motion.div>
  );
}

export default ToastCard;
