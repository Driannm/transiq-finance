// src/components/Toast/ToastCard.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from "@/store/ToastStore";

// ─── Spinner (loading state) ──────────────────────────────────────────────────

const SpinnerIcon = () => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
  >
    {/* Full circle track */}
    <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
    {/* Arc segment */}
    <path d="M12 3a9 9 0 0 1 9 9" strokeOpacity={1} />
  </motion.svg>
);

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  default: "bg-neutral-700",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

const VARIANT_DEFAULT_ICON: Record<ToastVariant, React.ReactNode> = {
  default: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      <motion.circle
        cx="12"
        cy="16"
        r="0.8"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
    </svg>
  ),
  success: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      />
    </svg>
  ),
  warning: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.line
        x1="12"
        y1="9"
        x2="12"
        y2="13"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      />
      <motion.circle
        cx="12"
        cy="17"
        r="0.8"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
    </svg>
  ),
  danger: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.line
        x1="15"
        y1="9"
        x2="9"
        y2="15"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      />
      <motion.line
        x1="9"
        y1="9"
        x2="15"
        y2="15"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      />
    </svg>
  ),
  info: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="12"
        y1="16"
        x2="12"
        y2="12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      <motion.circle
        cx="12"
        cy="8"
        r="0.8"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      />
    </svg>
  ),
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = toast.duration ?? 3500;
  const variant = toast.variant ?? "default";
  const status = toast.status ?? "idle";
  const isLoading = status === "loading";
  const iconBg = toast.iconBg ?? VARIANT_ICON_BG[variant];

  // Resolve the icon to display — priority: loading spinner > custom > variant default
  const resolvedIcon = isLoading ? (
    <SpinnerIcon />
  ) : (
    (toast.icon ?? VARIANT_DEFAULT_ICON[variant])
  );

  // Auto-dismiss — suppressed while loading (duration is 0 during loading)
  useEffect(() => {
    if (duration === 0) return;
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  const handlePress = () => {
    // Don't allow tap-dismiss while in loading state
    if (isLoading) return;
    if (toast.action?.onPress) {
      toast.action.onPress();
    }
    onDismiss();
  };

  const isTop = (toast.position ?? "top") === "top";

  return (
    <motion.div
      layout
      initial={{ y: isTop ? -80 : 100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: isTop ? -80 : 100, opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
      className={`
        flex items-center gap-3 w-full
        bg-neutral-900/95 dark:bg-neutral-800/95
        rounded-[22px] px-4 py-3.5
        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]
        border border-white/[0.08]
        backdrop-blur-xl
        cursor-pointer
        overflow-hidden
      `}
      onClick={handlePress}
      role="alert"
      aria-live="polite"
    >
      {/* Icon — iOS app icon style, animates between states */}
      <motion.div
        key={
          status
        } /* re-mount icon container on status change for spring pop */
        className={`
          w-12 h-12 rounded-[14px] flex-shrink-0
          flex items-center justify-center
          shadow-[0_2px_12px_rgba(0,0,0,0.3)]
          ${iconBg}
        `}
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        whileTap={isLoading ? undefined : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 450, damping: 22 }}
      >
        {resolvedIcon}
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[12.5px] text-white/60 leading-snug mt-0.5 line-clamp-2">
            {toast.description}
          </p>
        )}
      </div>

      {/* Action Chevron */}
      {toast.action && (
        <motion.div
          className="flex-shrink-0 ml-1"
          initial={{ x: 0 }}
          animate={{ x: toast.action.label ? 0 : 0 }}
        >
          {toast.action.label && (
            <span className="text-[13px] font-medium text-white/70 mr-1">
              {toast.action.label}
            </span>
          )}
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
            animate={{ x: [0, 3, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </motion.svg>
        </motion.div>
      )}

      {/* Progress bar (if duration > 0) */}
      {duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: duration / 1000,
            ease: "linear",
            onComplete: () => onDismiss(),
          }}
          style={{ originX: 0 }}
        />
      )}
    </motion.div>
  );
}

export default ToastCard;
