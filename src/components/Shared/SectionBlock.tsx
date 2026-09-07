"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

  /** Link opsional untuk title + arrow icon */
  titleHref?: string;

  /** Badge kecil (mis. "3 urgent") */
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

// ─── Badge Outline Color Classes ──────────────────────────────────────────────

const badgeOutlineColors: Record<
  NonNullable<SectionBadge["variant"]>,
  string
> = {
  red: "border-red-500/35 text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/15",
  blue: "border-blue-500/35 text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15",
  green:
    "border-emerald-500/35 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15",
  amber:
    "border-amber-500/35 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15",
  gray: "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100/50 dark:bg-neutral-900/50",
};

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  titleHref,
  badge,
  action,
}: Pick<SectionBlockProps, "title" | "titleHref" | "badge" | "action">) {
  return (
    <div className="flex items-center justify-between px-1 mb-2.5">
      {/* Left: title + arrow link */}
      <div className="flex items-center gap-1">
        {titleHref ? (
          <Link
            href={titleHref}
            className="group flex items-center gap-1 text-md font-semibold tracking-tight text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>{title}</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors group-hover:translate-x-0.5 transform"
            />
          </Link>
        ) : (
          <h3 className="text-md font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
      </div>

      {/* Right: badge & action */}
      <div className="flex items-center gap-2">
        {badge && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-semibold tracking-wide rounded-full px-2 py-0.5 shadow-none border",
              badgeOutlineColors[badge.variant ?? "gray"],
            )}
          >
            {badge.label}
          </Badge>
        )}

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
    </div>
  );
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────

/**
 * Komponen wrapper universal untuk section di Dashboard & Analytics.
 */
export function SectionBlock({
  title,
  titleHref,
  badge,
  action,
  children,
  className = "",
  padded = true,
}: SectionBlockProps) {
  const hasHeader = !!(title || badge || action);
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-20px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(padded ? "px-4" : "", "mt-5 space-y-2", className)}
    >
      {hasHeader && (
        <SectionHeader
          title={title}
          titleHref={titleHref}
          badge={badge}
          action={action}
        />
      )}
      {children}
    </motion.section>
  );
}
