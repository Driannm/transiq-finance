"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Refresh03Icon } from "@hugeicons/core-free-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PullToRefreshProps {
  children: React.ReactNode;
  /** Fungsi refresh kustom — jika tidak disediakan, akan memanggil router.refresh() */
  onRefresh?: () => Promise<void>;
  /** Jarak tarik minimum (px) untuk memicu refresh, default 80 */
  pullThreshold?: number;
  /** Maksimum jarak yang bisa ditarik (px), default 120 */
  maxPull?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 80,
  maxPull = 120,
}: PullToRefreshProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref untuk nilai terbaru yang dibutuhkan di dalam native event listener
  const isRefreshingRef = useRef(isRefreshing);
  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Container dengan scroll-nya sendiri agar scrollTop terbaca
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Motion values ────────────────────────────────────────
  const y = useMotionValue(0);
  const indicatorOpacity = useTransform(y, [30, pullThreshold], [0, 1]);
  const indicatorScale = useTransform(y, [30, pullThreshold], [0.6, 1]);
  const iconRotate = useTransform(y, [0, pullThreshold], [0, 360]);
  // ✅ Perbaikan: hook dipanggil di top-level
  const indicatorY = useTransform(y, [0, maxPull], [-60, 20]);

  // Variabel internal untuk tracking drag
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // ── Refresh action ──────────────────────────────────────
  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Fallback: refresh halaman (Next.js App Router)
        router.refresh();
        // Jeda agar animasi indikator terasa natural
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      // Anda bisa menambahkan toast / error state di sini
      console.error("Pull-to-refresh gagal:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, router]);

  // ── Mencegah native pull-to-refresh browser ─────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (isRefreshingRef.current) return;
      const startY = startYRef.current;
      if (startY === null) return;

      const delta = e.touches[0].clientY - startY;
      // Hanya cegah jika menarik ke bawah dan konten di posisi paling atas
      if (delta > 0 && el.scrollTop <= 0) {
        e.preventDefault();
      }
    };

    // Daftarkan dengan { passive: false } agar preventDefault bisa bekerja
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, []); // tidak perlu dependensi karena akses data via ref

  // ── Touch handlers ──────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Guard: jangan izinkan drag jika sedang refresh
    if (isRefreshingRef.current) return;

    const el = containerRef.current;
    // Hanya izinkan pull-to-refresh saat konten di posisi paling atas
    if (el && el.scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (isRefreshingRef.current) return;
      const startY = startYRef.current;
      if (startY === null) return;

      const delta = e.touches[0].clientY - startY;
      if (delta < 0) {
        y.set(0);
        return;
      }

      // Efek rubber‑band
      const eased = Math.min(delta * 0.4, maxPull);
      y.set(eased);
    },
    [y, maxPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startYRef.current = null;

    const currentY = y.get();

    if (currentY >= pullThreshold && !isRefreshingRef.current) {
      // Tahan indikator sebentar agar terlihat
      animate(y, 60, { type: "spring", stiffness: 300, damping: 30 });
      await triggerRefresh();
      // Kembalikan ke posisi awal
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      // Batal tarik
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [y, pullThreshold, triggerRefresh]);

  // ── Render ──────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Indikator refresh ─────────────────────────────── */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          opacity: isRefreshing ? 1 : indicatorOpacity,
          height: 90,
          y: indicatorY,
        }}
      >
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="spinning"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear",
              }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex items-center justify-center"
            >
              <HugeiconsIcon
                icon={Refresh03Icon}
                size={20}
                className="text-black dark:text-white"
                strokeWidth={1}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dragging"
              style={{ rotate: iconRotate }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex items-center justify-center"
            >
              <HugeiconsIcon
                icon={Refresh03Icon}
                size={20}
                className="text-black dark:text-white"
                strokeWidth={1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Konten halaman ───────────────────────────────── */}
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
