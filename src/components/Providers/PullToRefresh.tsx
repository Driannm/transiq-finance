"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadIcon } from "@hugeicons/core-free-icons";

// Jarak tarik (px) yang diperlukan untuk trigger refresh
const PULL_THRESHOLD = 80;
// Maksimal jarak yang bisa ditarik (px)
const MAX_PULL = 120;

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Posisi Y saat ini dari drag
  const y = useMotionValue(0);

  // Transformasi untuk ikon
  const indicatorOpacity = useTransform(y, [30, PULL_THRESHOLD], [0, 1]);
  const indicatorScale = useTransform(y, [30, PULL_THRESHOLD], [0.6, 1]);
  
  // Ikon akan berputar 360 derajat saat ditarik sejauh PULL_THRESHOLD
  const iconRotate = useTransform(y, [0, PULL_THRESHOLD], [0, 360]);

  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        router.refresh();
        await new Promise((r) => setTimeout(r, 1000)); // Delay sedikit untuk feel yang pas
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, router]);

  // ─── Touch handlers ──────────────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || startYRef.current === null) return;
      if (isRefreshing) return;

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta < 0) {
        y.set(0);
        return;
      }

      // Rubber-band effect
      const eased = Math.min(delta * 0.4, MAX_PULL);
      y.set(eased);
    },
    [isRefreshing, y]
  );

  const onTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const currentY = y.get();

    if (currentY >= PULL_THRESHOLD && !isRefreshing) {
      // Tahan di posisi refresh sejenak
      animate(y, 60, { type: "spring", stiffness: 300, damping: 30 });
      await triggerRefresh();
      // Kembalikan ke nol setelah selesai
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }

    startYRef.current = null;
  }, [y, isRefreshing, triggerRefresh]);

  return (
    <div
      className="relative min-h-screen"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Indicator ─────────────────────────────────────── */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          opacity: isRefreshing ? 1 : indicatorOpacity,
          height: 60,
          y: useTransform(y, [0, MAX_PULL], [-60, 20]), // Melayang sedikit di bawah top
        }}
      >
        <motion.div
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-neutral-900 shadow-xl border border-black/[0.05] dark:border-white/[0.1]"
          style={{ 
            scale: isRefreshing ? 1 : indicatorScale,
          }}
        >
          <motion.div
            style={{ 
                rotate: isRefreshing ? undefined : iconRotate 
            }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
            className="flex items-center justify-center"
          >
            <HugeiconsIcon
              icon={ReloadIcon}
              size={20}
              className="text-blue-600 dark:text-blue-400"
              strokeWidth={2.5}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Konten halaman ────────────────────────────────── */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}