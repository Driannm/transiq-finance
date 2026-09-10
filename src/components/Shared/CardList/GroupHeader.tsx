"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GroupHeaderType =
  | "expense"
  | "income"
  | "debts"
  | "loans"
  | "bills"
  | "default";

interface GroupHeaderProps {
  label: string;
  subtotal?: number;
  formattedSubtotal?: string;
  showSubtotal?: boolean;
  type?: GroupHeaderType;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Pill style: subtle label di kiri, subtotal badge di kanan.

export function GroupHeader({
  label,
  subtotal,
  formattedSubtotal,
  showSubtotal = true,
  type,
  className = "",
}: GroupHeaderProps) {
  const getBadgeStyle = () => {
    if (type === "debts") {
      return "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400";
    }
    if (type === "loans") {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
    }
    if (type === "bills") {
      return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400";
    }
    if (type === "expense") {
      return "bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400";
    }
    if (type === "income") {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
    }

    if (subtotal !== undefined && subtotal < 0) {
      return "bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400";
    }
    if (subtotal !== undefined && subtotal > 0) {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
    }

    return "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400";
  };

  return (
    <div
      className={[
        "flex items-center justify-between",
        "px-4 py-2.5",
        className,
      ].join(" ")}
    >
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </span>

      {showSubtotal && formattedSubtotal && (
        <span
          className={[
            "text-[11px] font-semibold font-mono tabular-nums",
            "px-2 py-0.5 rounded-md",
            getBadgeStyle(),
          ].join(" ")}
        >
          {formattedSubtotal}
        </span>
      )}
    </div>
  );
}

// Legacy alias — GroupHeaderV2 dipakai di CardList/index.tsx
export { GroupHeader as GroupHeaderV2 };
