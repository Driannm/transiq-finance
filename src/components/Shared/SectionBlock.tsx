"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionBadge = {
  label: string;
  variant?: "red" | "blue" | "green" | "amber" | "gray";
};

export type SectionAction =
  | { type: "link"; label: string; href: string }
  | { type: "button"; label: string; onPress: () => void }
  | { type: "text"; label: string };

export interface SectionBlockProps {
  /** Judul section */
  title: string;

  /** Badge kecil di sebelah title (mis. "3 urgent") */
  badge?: SectionBadge;

  /** Action di kanan header (See All, button, dsb.) */
  action?: SectionAction;

  /** Konten utama section */
  children: ReactNode;

  /** Spacing top (default: "mt-5") */
  className?: string;

  /** Apakah pakai px-4 wrapper atau tidak */
  padded?: boolean;
}

// ─── Badge Variants ───────────────────────────────────────────────────────────

const badgeVariants: Record<NonNullable<SectionBadge["variant"]>, string> = {
  red: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
  amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  badge,
  action,
}: Pick<SectionBlockProps, "title" | "badge" | "action">) {
  return (
    <div className="flex items-center justify-between px-1 mb-2.5">
      {/* Left: title + badge */}
      <div className="flex items-center gap-2">
        <h3 className="text-md font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {badge && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              badgeVariants[badge.variant ?? "gray"]
            }`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Right: action */}
      {action &&
        (action.type === "link" ? (
          <Link
            href={action.href}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {action.label}
          </Link>
        ) : action.type === "button" ? (
          <button
            onClick={action.onPress}
            className="text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-neutral-800 rounded-lg px-2.5 py-1 transition-colors"
          >
            {action.label}
          </button>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {action.label}
          </span>
        ))}
    </div>
  );
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────

/**
 * Komponen wrapper universal untuk section di Dashboard & Analytics.
 *
 * @example
 * <SectionBlock
 *   title="Upcoming Bills"
 *   badge={{ label: "3 urgent", variant: "red" }}
 *   action={{ type: "link", label: "See All", href: "/bills" }}
 * >
 *   <CardList ... />
 * </SectionBlock>
 */
export function SectionBlock({
  title,
  badge,
  action,
  children,
  className = "",
  padded = true,
}: SectionBlockProps) {
  return (
    <div className={`${padded ? "px-4" : ""} mt-5 space-y-2 ${className}`}>
      <SectionHeader title={title} badge={badge} action={action} />
      {children}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Icon node (mis. <HugeiconsIcon icon={...} size={32} />) */
  icon: ReactNode;
  title: string;
  description: string;
  /** Variant card: "card" = pakai bg putih (default), "inline" = transparan */
  variant?: "card" | "inline";
}

/**
 * Empty state yang konsisten di seluruh app.
 *
 * @example
 * <EmptyState
 *   icon={<HugeiconsIcon icon={Invoice02Icon} size={32} className="text-gray-300" />}
 *   title="No upcoming bills"
 *   description="You're all caught up!"
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  variant = "card",
}: EmptyStateProps) {
  const base = "px-4 py-10 text-center";
  const cardStyle =
    "bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800";

  return (
    <div className={`${base} ${variant === "card" ? cardStyle : ""}`}>
      <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h4>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
