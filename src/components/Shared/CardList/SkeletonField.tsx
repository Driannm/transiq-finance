import React from "react";
import { LayoutVariant } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SkeletonFieldType =
  | "icon"
  | "title"
  | "subtitle"
  | "amount"
  | "date"
  | "badge"
  | "bottom";

interface SkeletonFieldProps {
  type: SkeletonFieldType;
  variant?: LayoutVariant;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────
// Setiap ukuran harus match actual rendered content di LayoutVariants

const SIZES: Record<
  LayoutVariant,
  Partial<Record<SkeletonFieldType, string>>
> = {
  dashboard: {
    icon: "w-9 h-9 rounded-xl",
    title: "h-[14px] w-28",
    subtitle: "h-3 w-20",
    amount: "h-[14px] w-14",
    date: "", // tidak ada di dashboard
    badge: "",
    bottom: "",
  },
  detailed: {
    icon: "w-10 h-10 rounded-xl",
    title: "h-[14px] w-32",
    subtitle: "h-3 w-24",
    amount: "h-[14px] w-16",
    date: "h-3 w-12",
    badge: "h-5 w-16 rounded-full",
    bottom: "h-3 w-40",
  },
  compact: {
    icon: "",
    title: "h-3 w-24",
    subtitle: "",
    amount: "h-3 w-12",
    date: "",
    badge: "",
    bottom: "",
  },
  minimal: {
    icon: "",
    title: "h-2.5 w-20",
    subtitle: "",
    amount: "h-2.5 w-10",
    date: "",
    badge: "",
    bottom: "",
  },
  loan: {
    icon: "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl",
    title: "h-4 w-36",
    subtitle: "h-3 w-24",
    amount: "h-4 w-24",
    date: "h-3 w-28",
    badge: "h-5 w-20 rounded-full",
    bottom: "h-2 w-full rounded-full",
  },
};

// ─── SkeletonField ────────────────────────────────────────────────────────────

export function SkeletonField({
  type,
  variant = "dashboard",
  className = "",
}: SkeletonFieldProps) {
  const sizeClass = SIZES[variant]?.[type];
  if (!sizeClass) return null;

  return (
    <div
      className={[
        "animate-pulse rounded bg-gray-200 dark:bg-neutral-800",
        sizeClass,
        className,
      ].join(" ")}
    />
  );
}

// ─── SkeletonItem ─────────────────────────────────────────────────────────────
// Layout harus match persis dengan LayoutVariants

export function SkeletonItem({
  fields,
  variant = "dashboard",
  className = "",
}: {
  fields: SkeletonFieldType[];
  variant?: LayoutVariant;
  className?: string;
}) {
  const has = (f: SkeletonFieldType) => fields.includes(f);

  // ── detailed ────────────────────────────────────────────────────────────────
  if (variant === "detailed") {
    return (
      <div className={["px-4 py-3", className].join(" ")}>
        {/* Baris 1: icon + title/subtitle + amount/date */}
        <div className="flex items-start gap-3">
          {has("icon") && <SkeletonField type="icon" variant={variant} />}
          <div className="flex-1 space-y-1.5 min-w-0 pt-0.5">
            {has("title") && <SkeletonField type="title" variant={variant} />}
            {has("subtitle") && (
              <SkeletonField type="subtitle" variant={variant} />
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-2">
            {has("amount") && <SkeletonField type="amount" variant={variant} />}
            {has("date") && <SkeletonField type="date" variant={variant} />}
          </div>
        </div>
        {/* Baris 2: bottom note */}
        {has("bottom") && (
          <div className="mt-1.5 pl-[52px]">
            <SkeletonField type="bottom" variant={variant} />
          </div>
        )}
        {/* Badge */}
        {has("badge") && (
          <div className="mt-1.5 pl-[52px]">
            <SkeletonField type="badge" variant={variant} />
          </div>
        )}
      </div>
    );
  }

  // ── compact / minimal ───────────────────────────────────────────────────────
  if (variant === "compact" || variant === "minimal") {
    const px = variant === "minimal" ? "px-3" : "px-4";
    const py = variant === "compact" ? "py-2.5" : "py-2";
    return (
      <div
        className={[
          "flex items-center justify-between",
          px,
          py,
          className,
        ].join(" ")}
      >
        {has("title") && <SkeletonField type="title" variant={variant} />}
        {has("amount") && <SkeletonField type="amount" variant={variant} />}
      </div>
    );
  }

  // ── loan ─────────────────────────────────────────────────────────────────────
  if (variant === "loan") {
    return (
      <div
        className={[
          "bg-white dark:bg-neutral-900 border border-gray-150/70 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4",
          className,
        ].join(" ")}
      >
        {/* Top row: icon + title/debtor + amount/stamp */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {has("icon") && <SkeletonField type="icon" variant={variant} />}
            <div className="space-y-2">
              {has("title") && <SkeletonField type="title" variant={variant} />}
              {has("subtitle") && (
                <SkeletonField type="subtitle" variant={variant} />
              )}
            </div>
          </div>
          <div className="space-y-2 text-right">
            {has("date") && (
              <SkeletonField
                type="date"
                variant={variant}
                className="ml-auto"
              />
            )}
            {has("amount") && <SkeletonField type="amount" variant={variant} />}
          </div>
        </div>
        {/* Progress bar */}
        {has("bottom") && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
            </div>
            <SkeletonField type="bottom" variant={variant} />
          </div>
        )}
        {/* Bottom row: due date + button */}
        {has("badge") && (
          <div className="flex justify-between items-center pt-0.5">
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-neutral-800 animate-pulse" />
            <SkeletonField type="badge" variant={variant} />
          </div>
        )}
      </div>
    );
  }

  // ── dashboard (default) ─────────────────────────────────────────────────────
  return (
    <div
      className={[
        "flex items-center justify-between px-4 py-3",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {has("icon") && <SkeletonField type="icon" variant={variant} />}
        <div className="space-y-2">
          {has("title") && <SkeletonField type="title" variant={variant} />}
          {has("subtitle") && (
            <SkeletonField type="subtitle" variant={variant} />
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {has("amount") && <SkeletonField type="amount" variant={variant} />}
        {has("date") && <SkeletonField type="date" variant={variant} />}
      </div>
    </div>
  );
}
