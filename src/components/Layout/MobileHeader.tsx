"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeaderAction {
  icon: IconSvgElement;
  onPress: () => void;
  badge?: boolean;
  label?: string;
}

export interface AppHeaderProps {
  // Left — profile
  avatarText?: string;
  avatarUri?: string;
  greeting?: string;
  userName?: string;
  leftSlot?: React.ReactNode;

  // Center — dynamic
  title?: string;
  centerSlot?: React.ReactNode;

  // Right — max 2
  actions?: [] | [HeaderAction] | [HeaderAction, HeaderAction];

  // Scroll
  scrollRef?: React.RefObject<HTMLElement>;

  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppHeader({
  avatarText = "JJ",
  avatarUri,
  greeting = "Welcome back,",
  userName = "John Jacob",
  leftSlot,
  title,
  centerSlot,
  actions = [],
  scrollRef,
  className = "",
}: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const target = scrollRef?.current ?? window;
    const check = () => {
      const y = scrollRef?.current
        ? scrollRef.current.scrollTop
        : window.scrollY;
      setScrolled(y > 8);
    };
    target.addEventListener("scroll", check, { passive: true });
    check();
    return () => target.removeEventListener("scroll", check);
  }, [scrollRef]);

  const hasCenter = !!(title || centerSlot);

  return (
    <header
      className={[
        "sticky top-0 z-50 px-5 py-3",
        /**
         * KUNCI PERBAIKAN:
         * Pakai grid 3 kolom — bukan flex justify-between.
         * Kolom kiri & kanan pakai "auto" (shrink ke konten),
         * kolom tengah pakai "1fr" (ambil sisa ruang).
         * Ini yang bikin title bisa benar-benar di tengah layar.
         */
        hasCenter
          ? "grid grid-cols-[auto_1fr_auto] items-center gap-3"
          : "flex items-center justify-between gap-3",
        "transition-all duration-300 ease-in-out",
        scrolled
          ? [
              "bg-white/70 backdrop-blur-xl backdrop-saturate-150",
              "border-b border-black/[0.06]",
              "shadow-[0_1px_20px_rgba(0,0,0,0.06)]",
              "dark:bg-black/50 dark:border-white/[0.08]",
              "dark:shadow-[0_1px_24px_rgba(0,0,0,0.4)]",
            ].join(" ")
          : "bg-transparent",
        className,
      ].join(" ")}
    >
      {/* ── LEFT ── */}
      <div className="flex items-center gap-3 min-w-0">
        {leftSlot ?? (
          <>
            {avatarUri ? (
              <img
                src={avatarUri}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0 select-none">
                {avatarText}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 dark:text-white/50 leading-none mb-0.5">
                {greeting}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {userName}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── CENTER (opsional) ── */}
      {hasCenter && (
        <div className="flex justify-center items-center min-w-0">
          {centerSlot ?? (
            <span className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </span>
          )}
        </div>
      )}

      {/* ── RIGHT ── */}
      <div className="flex items-center justify-end shrink-0">
        {actions.length === 0 ? null : actions.length === 1 ? (
          <ActionButton action={actions[0]} />
        ) : (
          <div className="flex items-center bg-gray-100 dark:bg-white/10 rounded-full p-1 gap-0.5">
            <ActionButton action={actions[0]} />
            <ActionButton action={actions[1]} />
          </div>
        )}
      </div>
    </header>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({ action }: { action: HeaderAction }) {
  return (
    <button
      onClick={action.onPress}
      aria-label={action.label}
      className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
    >
      <HugeiconsIcon icon={action.icon} size={20} />
      {action.badge && (
        <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white dark:border-black" />
      )}
    </button>
  );
}