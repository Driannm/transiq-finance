// src/components/Toast/ToastCard.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, type ToastItem, type ToastVariant } from "@/store/ToastStore";

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  default: "bg-neutral-700",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  info:    "bg-blue-500",
};

const VARIANT_DEFAULT_ICON: Record<ToastVariant, React.ReactNode> = {
  default: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  danger: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
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
  const variant  = toast.variant ?? "default";
  const iconBg   = toast.iconBg ?? VARIANT_ICON_BG[variant];

  // Auto-dismiss
  useEffect(() => {
    if (duration === 0) return;
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, onDismiss]);

  const handlePress = () => {
    if (toast.action?.onPress) {
      toast.action.onPress();
    }
    onDismiss();
  };

  return (
    <motion.div
      layout
      initial={{ y: 100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.95 }}
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
      {/* Icon — iOS app icon style */}
      <motion.div 
        className={`
          w-12 h-12 rounded-[14px] flex-shrink-0
          flex items-center justify-center
          shadow-[0_2px_12px_rgba(0,0,0,0.3)]
          ${iconBg}
        `}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {toast.icon ?? VARIANT_DEFAULT_ICON[variant]}
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0 flex-1">
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
              ease: "easeInOut" 
            }}
          >
            <path d="M9 18l6-6-6-6"/>
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
            onComplete: () => onDismiss()
          }}
          style={{ originX: 0 }}
        />
      )}
    </motion.div>
  );
}

export default ToastCard;