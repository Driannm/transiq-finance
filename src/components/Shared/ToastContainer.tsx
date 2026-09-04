// src/components/Toast/ToastContainer.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/ToastStore";
import ToastCard from "./ToastCard";

// Reasonable ceiling so the DOM never has to render dozens of toasts at once.
const MAX_VISIBLE_TOASTS = 4;

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const hide = useToastStore((s) => s.hide);

  const topToasts = toasts
    .filter((t) => (t.position ?? "top") === "top")
    .slice(-MAX_VISIBLE_TOASTS);

  const bottomToasts = toasts
    .filter((t) => (t.position ?? "top") === "bottom")
    .slice(-MAX_VISIBLE_TOASTS);

  return (
    <>
      {/* Top toasts */}
      <AnimatePresence>
        {topToasts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 px-4 pt-6 pt-safe-top pointer-events-none"
          >
            {/* mode="popLayout" agar reflow smooth saat toast dismiss di tengah stack */}
            <AnimatePresence mode="popLayout">
              {topToasts.map((toast) => (
                <ToastCard
                  key={toast.id}
                  toast={toast}
                  onDismiss={() => hide(toast.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom toasts */}
      <AnimatePresence>
        {bottomToasts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col-reverse items-center gap-2 px-4 pb-6 pb-safe-bottom pointer-events-none"
          >
            <AnimatePresence mode="popLayout">
              {bottomToasts.map((toast) => (
                <ToastCard
                  key={toast.id}
                  toast={toast}
                  onDismiss={() => hide(toast.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
