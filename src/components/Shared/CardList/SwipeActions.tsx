// src/components/Shared/CardList/SwipeActions.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { SwipeAction } from "./types";
import { useConfirmStore } from "@/store/ConfirmStore";
import { create } from "zustand";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_WIDTH = 72;
const THRESHOLD    = 36;

const BG_COLORS: Record<string, string> = {
  primary: "bg-blue-500 hover:bg-blue-600 transition-colors",
  danger:  "bg-red-500 hover:bg-red-650 transition-colors",
  success: "bg-emerald-500 hover:bg-emerald-600 transition-colors",
  warning: "bg-amber-500 hover:bg-amber-600 transition-colors",
  neutral: "bg-gray-500 hover:bg-gray-600 transition-colors",
  indigo:  "bg-indigo-605 hover:bg-indigo-700 transition-colors",
};

// ─── Swipe Active Card Registry Store ─────────────────────────────────────────

interface SwipeRegistryStore {
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
}

export const useSwipeRegistry = create<SwipeRegistryStore>((set) => ({
  activeCardId: null,
  setActiveCardId: (id) => set({ activeCardId: id }),
}));

// ─── Component Props ──────────────────────────────────────────────────────────

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
  const { activeCardId, setActiveCardId } = useSwipeRegistry();

  const [revealed, setRevealed] = useState<"left" | "right" | null>(null);
  
  const rightCount = actions.filter((a) => (a.position ?? "right") === "right").length;
  const leftCount  = actions.filter((a) => a.position === "left").length;
  const MAX_RIGHT  = rightCount * ACTION_WIDTH;
  const MAX_LEFT   = leftCount  * ACTION_WIDTH;

  const dragX = useMotionValue(0);

  // Close helper
  const close = useCallback(() => {
    animate(dragX, 0, { type: "spring", stiffness: 350, damping: 30 });
    setRevealed(null);
    onOpenChange?.(false);
    if (activeCardId === String(itemId)) {
      setActiveCardId(null);
    }
  }, [dragX, activeCardId, itemId, onOpenChange, setActiveCardId]);

  // Execute Action
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

  // Sync registry updates: close if another card opens
  useEffect(() => {
    if (activeCardId !== null && activeCardId !== String(itemId)) {
      animate(dragX, 0, { type: "spring", stiffness: 350, damping: 30 });
      setRevealed(null);
      onOpenChange?.(false);
    }
  }, [activeCardId, itemId, dragX, onOpenChange]);

  // Sync Controlled Props
  useEffect(() => {
    if (controlledIsOpen === undefined) return;
    if (controlledIsOpen) {
      const dir = rightCount > 0 ? "right" : "left";
      const target = dir === "right" ? -MAX_RIGHT : MAX_LEFT;
      animate(dragX, target, { type: "spring", stiffness: 350, damping: 30 });
      setRevealed(dir);
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 350, damping: 30 });
      setRevealed(null);
    }
  }, [controlledIsOpen, rightCount, MAX_RIGHT, MAX_LEFT, dragX]);

  // Drag Handlers
  const handleDragStart = () => {
    setActiveCardId(String(itemId));
  };

  const handleDragEnd = (event: any, info: any) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const currentX = dragX.get();

    let targetX = 0;
    
    // Quick swiping detection using velocity
    if (velocityX < -250 && rightCount > 0) {
      targetX = -MAX_RIGHT;
    } else if (velocityX > 250 && leftCount > 0) {
      targetX = MAX_LEFT;
    } 
    // Absolute position threshold detection
    else if (currentX < -THRESHOLD && rightCount > 0) {
      targetX = -MAX_RIGHT;
    } else if (currentX > THRESHOLD && leftCount > 0) {
      targetX = MAX_LEFT;
    }

    animate(dragX, targetX, { type: "spring", stiffness: 350, damping: 30 });
    
    if (targetX === 0) {
      setRevealed(null);
      onOpenChange?.(false);
      if (activeCardId === String(itemId)) {
        setActiveCardId(null);
      }
    } else {
      setRevealed(targetX < 0 ? "right" : "left");
      onOpenChange?.(true);
    }
  };

  // Setup Motion progress mappings for actions opacity and scale
  const rightProgress = useTransform(dragX, [-MAX_RIGHT, 0], [1, 0]);
  const leftProgress = useTransform(dragX, [0, MAX_LEFT], [0, 1]);

  // Setup Dynamic Pointer Events
  const rightPointerEvents = useTransform(dragX, (x) => (x < -10 ? "auto" : "none"));
  const leftPointerEvents = useTransform(dragX, (x) => (x > 10 ? "auto" : "none"));

  const renderActions = (position: "left" | "right") => {
    const filtered = actions.filter((a) =>
      position === "left"
        ? a.position === "left"
        : (a.position ?? "right") === "right"
    );
    if (filtered.length === 0) return null;

    const totalWidth = filtered.length * ACTION_WIDTH;
    const progress = position === "right" ? rightProgress : leftProgress;
    const pointerEvents = position === "right" ? rightPointerEvents : leftPointerEvents;

    return (
      <motion.div
        className={`absolute inset-y-0 ${position}-0 flex`}
        style={{
          width: totalWidth,
          clipPath: "inset(0)",
          pointerEvents: pointerEvents as any,
        }}
      >
        {filtered.map((action, idx) => {
          // Dynamic opacity and scale driven directly by gesture position (Composited/FPS safe)
          const buttonOpacity = useTransform(progress, [0, 1], [0, 1]);
          const buttonScale = useTransform(progress, [0, 1], [0.85, 1]);

          return (
            <motion.button
              key={action.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                executeAction(action);
              }}
              style={{
                width: ACTION_WIDTH,
                opacity: buttonOpacity,
                scale: buttonScale,
              }}
              className={[
                "flex flex-col items-center justify-center gap-1.5 text-white select-none pointer-events-auto h-full",
                BG_COLORS[action.variant] ?? BG_COLORS.neutral,
              ].join(" ")}
              aria-label={action.label}
            >
              <div className="flex items-center justify-center w-5 h-5 pointer-events-none">
                {action.icon}
              </div>
              <span className="text-[10px] font-bold leading-none tracking-wide opacity-90 pointer-events-none">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="relative select-none touch-pan-y overflow-hidden" role="listitem">
      {/* Dynamic Actions background views */}
      {renderActions("right")}
      {renderActions("left")}

      {/* Foreground card linked to Motion drag */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -MAX_RIGHT, right: MAX_LEFT }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className="relative bg-white dark:bg-neutral-900 cursor-grab active:cursor-grabbing z-15"
      >
        {children}
      </motion.div>
    </div>
  );
}