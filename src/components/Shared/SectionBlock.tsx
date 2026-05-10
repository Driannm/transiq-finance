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
  title: string;
  badge?: SectionBadge;
  action?: SectionAction;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

// ─── Existing code remains the same until EmptyStateProps ─────────────────────

// ... (keep SectionBadge, SectionAction, SectionBlockProps, SectionHeader, and SectionBlock as they are)

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateAction {
  label: string;
  onPress: () => void | Promise<void>;
}

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  variant?: "card" | "inline";
  action?: EmptyStateAction; // Add this line
}

export function EmptyState({
  icon,
  title,
  description,
  variant = "card",
  action, // Add this destructuring
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
      
      {/* Add this render block for the action button */}
      {action && (
        <button
          onClick={action.onPress}
          className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}