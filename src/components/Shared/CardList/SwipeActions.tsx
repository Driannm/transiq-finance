"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SwipeAction } from "./types";
import { useConfirmStore } from "@/store/ConfirmStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_WIDTH = 72;   // px — lebar tiap action button
const THRESHOLD    = 36;   // px — min swipe untuk snap open

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Spring-like ease — overshoots sedikit lalu settle */
function easeSpring(t: number): number {
  return 1 - Math.pow(1 - t, 4) * Math.cos(t * Math.PI * 1.5);
}

const BG_COLORS: Record<string, string> = {
  primary: "bg-blue-500 active:bg-blue-600",
  danger:  "bg-red-500 active:bg-red-600",
  success: "bg-emerald-500 active:bg-emerald-600",
  warning: "bg-amber-500 active:bg-amber-600",
  neutral: "bg-gray-500 active:bg-gray-600",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeableCardProps {
  children:      React.ReactNode;
  actions:       SwipeAction[];
  itemId:        string | number;
  isOpen?:       boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeableCard({
  children,
  actions,
  itemId,
  isOpen: controlledIsOpen,
  onOpenChange,
}: SwipeableCardProps) {
  const openConfirm = useConfirmStore((s) => s.open);

  const [offset, setOffset]    = useState(0);
  const [revealed, setRevealed] = useState<"left" | "right" | null>(null);

  const rafRef             = useRef<number>();
  const startXRef          = useRef(0);
  const startOffsetRef     = useRef(0);
  const isSwipingRef       = useRef(false);
  const currentOffsetRef   = useRef(0);
  const isControlled       = controlledIsOpen !== undefined;

  // Derived max offset based on action count per side
  const rightCount = actions.filter((a) => (a.position ?? "right") === "right").length;
  const leftCount  = actions.filter((a) => a.position === "left").length;
  const MAX_RIGHT  = rightCount * ACTION_WIDTH;
  const MAX_LEFT   = leftCount  * ACTION_WIDTH;

  // Sync offset ref
  useEffect(() => { currentOffsetRef.current = offset; }, [offset]);

  // Controlled mode sync
  useEffect(() => {
    if (!isControlled) return;
    if (controlledIsOpen) {
      // default ke kanan jika ada
      const dir = rightCount > 0 ? "right" : "left";
      const max = dir === "right" ? -MAX_RIGHT : MAX_LEFT;
      animateTo(max);
      setRevealed(dir);
    } else {
      animateTo(0);
      setRevealed(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledIsOpen, isControlled]);

  // Cleanup RAF
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Animation ─────────────────────────────────────────────────────────────
  const animateTo = useCallback((target: number, onDone?: () => void) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from      = currentOffsetRef.current;
    const dist      = Math.abs(target - from);
    // Durasi proporsional — pendek kalau dekat
    const duration  = Math.min(Math.max(dist * 1.2, 160), 300);
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value    = from + (target - from) * easeSpring(progress);
      setOffset(value);
      currentOffsetRef.current = value;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Close ─────────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    animateTo(0, () => setRevealed(null));
    onOpenChange?.(false);
  }, [animateTo, onOpenChange]);

  // ── Execute action (dipanggil HANYA saat user tap tombol) ─────────────────
  const executeAction = useCallback(
    (action: SwipeAction) => {
      if (action.requiresConfirm) {
        openConfirm({
          title:        `${action.label}?`,
          description:  action.confirmMessage ?? "Tindakan ini tidak dapat dibatalkan.",
          confirmLabel: action.label,
          variant:
            action.variant === "danger"  ? "danger"  :
            action.variant === "warning" ? "warning" : "safe",
          icon:      action.icon,
          onConfirm: async () => {
            await action.onExecute(itemId);
            close();
          },
          onCancel: close,
        });
      } else {
        action.onExecute(itemId);
        close();
      }
    },
    [itemId, openConfirm, close]
  );

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current      = e.touches[0].clientX;
    startOffsetRef.current = currentOffsetRef.current;
    isSwipingRef.current   = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;

    const diff     = e.touches[0].clientX - startXRef.current;
    const hasLeft  = leftCount  > 0;
    const hasRight = rightCount > 0;

    if (diff < 0 && !hasRight) return;
    if (diff > 0 && !hasLeft)  return;

    let next = startOffsetRef.current + diff;

    // Rubber-band di luar batas
    if (next < -MAX_RIGHT) next = -MAX_RIGHT + (next + MAX_RIGHT) * 0.2;
    if (next >  MAX_LEFT)  next =  MAX_LEFT  + (next - MAX_LEFT)  * 0.2;

    setOffset(next);
    currentOffsetRef.current = next;

    // Tampilkan action area segera saat mulai swipe
    if (next < -4)       setRevealed("right");
    else if (next > 4)   setRevealed("left");
    else                 setRevealed(null);

    e.preventDefault();
  }, [leftCount, rightCount, MAX_LEFT, MAX_RIGHT]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;

    const curr     = currentOffsetRef.current;
    const abscurr  = Math.abs(curr);
    const snapOpen = abscurr > THRESHOLD;

    if (snapOpen) {
      const dir    = curr < 0 ? "right" : "left";
      const target = dir === "right" ? -MAX_RIGHT : MAX_LEFT;
      animateTo(target);
      setRevealed(dir);
      if (!isControlled) onOpenChange?.(true);
      // ⚠️ TIDAK auto-execute di sini — user harus tap tombol
    } else {
      animateTo(0, () => setRevealed(null));
      if (!isControlled) onOpenChange?.(false);
    }
  }, [animateTo, isControlled, MAX_LEFT, MAX_RIGHT, onOpenChange]);

  // ── Render actions ────────────────────────────────────────────────────────
  const renderActions = (position: "left" | "right") => {
    const filtered = actions.filter((a) =>
      position === "left"
        ? a.position === "left"
        : (a.position ?? "right") === "right"
    );
    if (filtered.length === 0) return null;

    const totalWidth = filtered.length * ACTION_WIDTH;
    const isVisible  = revealed === position;

    return (
      <div
        className={`absolute inset-y-0 ${position}-0 flex`}
        style={{
          width: totalWidth,
          // Clip agar tidak bocor ke card sebelumnya/sesudahnya
          clipPath: "inset(0)",
          // Fade-in saat pertama kali reveal
          opacity:    isVisible ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        {filtered.map((action, idx) => {
          // Setiap tombol slide-in dari sisi yang sesuai
          const slideX = position === "right"
            ? `${(1 - Math.min(Math.abs(offset) / ACTION_WIDTH, 1)) * ACTION_WIDTH}px`
            : `${-(1 - Math.min(offset / ACTION_WIDTH, 1)) * ACTION_WIDTH}px`;

          return (
            <button
              key={action.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); executeAction(action); }}
              style={{
                width: ACTION_WIDTH,
                transform: `translateX(${slideX})`,
                transitionDelay: `${idx * 20}ms`,
              }}
              className={[
                "flex flex-col items-center justify-center gap-1 text-white",
                "transition-transform duration-200 ease-out",
                BG_COLORS[action.variant] ?? BG_COLORS.neutral,
              ].join(" ")}
              aria-label={action.label}
            >
              {/* Icon — 18px konsisten */}
              <span
                className="flex items-center justify-center"
                style={{ width: 18, height: 18 }}
              >
                {action.icon}
              </span>
              <span className="text-[10px] font-medium leading-none tracking-wide opacity-90">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="relative select-none touch-pan-y overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (Math.abs(currentOffsetRef.current) > 4) close();
      }}
      role="listitem"
    >
      {renderActions("right")}
      {renderActions("left")}

      {/* Foreground card */}
      <div
        className="relative bg-white dark:bg-neutral-900 will-change-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}