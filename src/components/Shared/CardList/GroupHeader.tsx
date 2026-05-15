"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  label:              string;
  subtotal?:          number;
  formattedSubtotal?: string;
  showSubtotal?:      boolean;
  className?:         string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function subtotalColor(subtotal?: number): string {
  if (!subtotal || subtotal === 0) return "text-gray-400 dark:text-gray-500";
  return subtotal < 0
    ? "text-red-500 dark:text-red-400"
    : "text-emerald-500 dark:text-emerald-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSI 1 — Perbaikan dari versi kamu
// Lebih bersih: hilangkan border bawah yang bentrok dengan divider item,
// perkecil py, label lebih subtle, subtotal lebih tegas
// ─────────────────────────────────────────────────────────────────────────────

export function GroupHeader({
  label,
  subtotal,
  formattedSubtotal,
  showSubtotal = true,
  className = "",
}: GroupHeaderProps) {
  return (
    <div
      className={[
        "sticky top-0 z-10",
        "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm",
        "flex items-center justify-between",
        "px-4 py-1.5",
        // Tidak ada border — divider dari CardList sudah cukup
        className,
      ].join(" ")}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
        {label}
      </span>

      {showSubtotal && formattedSubtotal && (
        <span
          className={[
            "text-[11px] font-semibold font-mono tabular-nums",
            subtotalColor(subtotal),
          ].join(" ")}
        >
          {formattedSubtotal}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSI 2 — Design dari gua
// Pill label di kiri, subtotal sebagai badge pill di kanan.
// Tidak sticky — float di antara item, terasa lebih "card-native".
// ─────────────────────────────────────────────────────────────────────────────

export function GroupHeaderV2({
  label,
  subtotal,
  formattedSubtotal,
  showSubtotal = true,
  className = "",
}: GroupHeaderProps) {
  const isExpense = subtotal !== undefined && subtotal < 0;
  const isIncome  = subtotal !== undefined && subtotal > 0;

  return (
    <div
      className={[
        "flex items-center justify-between",
        "px-4 py-2.5",
        className,
      ].join(" ")}
    >
      {/* Label pill */}
      <span className="
        text-[11px] font-semibold
        text-gray-500 dark:text-gray-400
      ">
        {label}
      </span>

      {/* Subtotal badge */}
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