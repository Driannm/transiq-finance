"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  label: string;
  subtotal?: number;
  formattedSubtotal?: string;
  showSubtotal?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Pill style: subtle label di kiri, subtotal badge di kanan.

export function GroupHeader({
  label,
  subtotal,
  formattedSubtotal,
  showSubtotal = true,
  className = "",
}: GroupHeaderProps) {
  const isExpense = subtotal !== undefined && subtotal < 0;
  const isIncome = subtotal !== undefined && subtotal > 0;

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
            isExpense
              ? "bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400"
              : isIncome
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400",
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
