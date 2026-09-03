// src/components/Toast/ToastContainer.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/ToastStore";
import ToastCard from "./ToastCard";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const hide = useToastStore((s) => s.hide);

  const topToasts = toasts.filter((t) => (t.position ?? "top") === "top");
  const bottomToasts = toasts.filter((t) => (t.position ?? "top") === "bottom");

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
            {topToasts.map((toast) => (
              <motion.div 
                key={toast.id}
                initial={{ y: -100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -100, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full max-w-sm pointer-events-auto"
              >
                <ToastCard 
                  toast={toast} 
                  onDismiss={() => hide(toast.id)} 
                />
              </motion.div>
            ))}
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
            {bottomToasts.map((toast) => (
              <motion.div 
                key={toast.id}
                className="w-full max-w-sm pointer-events-auto"
              >
                <ToastCard 
                  toast={toast} 
                  onDismiss={() => hide(toast.id)} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}