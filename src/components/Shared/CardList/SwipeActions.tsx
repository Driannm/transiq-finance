// src/components/Shared/CardList/SwipeableCard.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SwipeAction } from "./types";
import { useConfirmStore } from "@/store/ConfirmStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_WIDTH = 72;
const THRESHOLD    = 36;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

  const [offset,      setOffset]      = useState(0);
  const [revealed,    setRevealed]    = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const isDraggingRef    = useRef(false);
  const startXRef        = useRef(0);
  const startOffsetRef   = useRef(0);
  const currentOffsetRef = useRef(0);
  const isControlled     = controlledIsOpen !== undefined;

  const rightCount = actions.filter((a) => (a.position ?? "right") === "right").length;
  const leftCount  = actions.filter((a) => a.position === "left").length;
  const MAX_RIGHT  = rightCount * ACTION_WIDTH;
  const MAX_LEFT   = leftCount  * ACTION_WIDTH;

  // Sync offset ref
  useEffect(() => { currentOffsetRef.current = offset; }, [offset]);

  // ── Animation ─────────────────────────────────────────────────────────────

  const snapTo = useCallback((target: number) => {
    setIsAnimating(true);
    setOffset(target);
    currentOffsetRef.current = target;
    setTimeout(() => {
      if (target === 0) setRevealed(null);
      setIsAnimating(false);
    }, 320);
  }, []);

  // ── Close ─────────────────────────────────────────────────────────────────

  const close = useCallback(() => {
    snapTo(0);
    onOpenChange?.(false);
  }, [snapTo, onOpenChange]);

  // Controlled mode sync
  useEffect(() => {
    if (!isControlled) return;
    if (controlledIsOpen) {
      const dir    = rightCount > 0 ? "right" : "left";
      const target = dir === "right" ? -MAX_RIGHT : MAX_LEFT;
      snapTo(target);
      setRevealed(dir);
    } else {
      snapTo(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledIsOpen, isControlled]);

  // ── Execute action ────────────────────────────────────────────────────────

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
    if (isAnimating) return;
    startXRef.current      = e.touches[0].clientX;
    startOffsetRef.current = currentOffsetRef.current;
    isDraggingRef.current  = true;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || isAnimating) return;

    const diff     = e.touches[0].clientX - startXRef.current;
    const hasLeft  = leftCount  > 0;
    const hasRight = rightCount > 0;

    if (diff < 0 && !hasRight) return;
    if (diff > 0 && !hasLeft)  return;

    let next = startOffsetRef.current + diff;

    // Rubber-band natural — makin jauh makin berat
    if (next < -MAX_RIGHT) {
      const over = next + MAX_RIGHT;
      next = -MAX_RIGHT + over * Math.pow(0.5, 1 + Math.abs(over) / MAX_RIGHT);
    }
    if (next > MAX_LEFT) {
      const over = next - MAX_LEFT;
      next = MAX_LEFT + over * Math.pow(0.5, 1 + Math.abs(over) / MAX_LEFT);
    }

    setOffset(next);
    currentOffsetRef.current = next;

    if (next < -4)     setRevealed("right");
    else if (next > 4) setRevealed("left");
    else               setRevealed(null);

    e.preventDefault();
  }, [isAnimating, leftCount, rightCount, MAX_LEFT, MAX_RIGHT]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const curr     = currentOffsetRef.current;
    const snapOpen = Math.abs(curr) > THRESHOLD;

    if (snapOpen) {
      const dir    = curr < 0 ? "right" : "left";
      const target = dir === "right" ? -MAX_RIGHT : MAX_LEFT;
      snapTo(target);
      setRevealed(dir);
      onOpenChange?.(true);
    } else {
      snapTo(0);
      onOpenChange?.(false);
    }
  }, [snapTo, MAX_LEFT, MAX_RIGHT, onOpenChange]);

  // ── Render actions [FIX: transition shorthand includes delay] ─────────────

  const renderActions = (position: "left" | "right") => {
    const filtered = actions.filter((a) =>
      position === "left"
        ? a.position === "left"
        : (a.position ?? "right") === "right"
    );
    if (filtered.length === 0) return null;

    const totalWidth = filtered.length * ACTION_WIDTH;

    return (
      <div
        className={`absolute inset-y-0 ${position}-0 flex`}
        style={{
          width:         totalWidth,
          clipPath:      "inset(0)",
          pointerEvents: revealed === position ? "auto" : "none",
        }}
      >
        {filtered.map((action, idx) => {
          const progress = position === "right"
            ? Math.min(Math.abs(offset) / ACTION_WIDTH, 1)
            : Math.min(offset / ACTION_WIDTH, 1);

          // ✅ FIX: Include delay in transition shorthand (no separate transitionDelay)
          const transitionValue = isDraggingRef.current
            ? "none"
            : `opacity 300ms ease ${idx * 20}ms, transform 300ms cubic-bezier(0.32, 0.72, 0, 1) ${idx * 20}ms`;

          return (
            <button
              key={action.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); executeAction(action); }}
              style={{
                width:      ACTION_WIDTH,
                opacity:    progress,
                transform:  `scale(${0.8 + progress * 0.2})`,
                transition: transitionValue,  // ✅ Delay included here
                // ❌ JANGAN pakai transitionDelay terpisah — conflict dengan shorthand!
              }}
              className={[
                "flex flex-col items-center justify-center gap-1 text-white",
                BG_COLORS[action.variant] ?? BG_COLORS.neutral,
              ].join(" ")}
              aria-label={action.label}
            >
              <span className="flex items-center justify-center" style={{ width: 18, height: 18 }}>
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative select-none touch-pan-y overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (Math.abs(currentOffsetRef.current) > 4) close(); }}
      role="listitem"
    >
      {renderActions("right")}
      {renderActions("left")}

      {/* Foreground card */}
      <div
        className="relative bg-white dark:bg-neutral-900"
        style={{
          transform:  `translateX(${offset}px)`,
          transition: isDraggingRef.current
            ? "none"
            : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}