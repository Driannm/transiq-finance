"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

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
    "bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800";

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