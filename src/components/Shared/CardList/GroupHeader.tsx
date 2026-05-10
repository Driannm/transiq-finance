"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  label:             string;
  subtotal?:         number;
  formattedSubtotal?: string;
  showSubtotal?:     boolean;
  className?:        string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function subtotalColor(subtotal?: number): string {
  if (!subtotal || subtotal === 0) return "text-gray-400 dark:text-gray-500";
  return subtotal < 0
    ? "text-red-500 dark:text-red-400"
    : "text-emerald-500 dark:text-emerald-400";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * GroupHeader — sticky date/group separator untuk CardList grouped layout.
 *
 * PENTING: Parent container TIDAK boleh pakai `overflow-hidden` agar `sticky` bekerja.
 * Gunakan `overflow-clip` jika perlu clip horizontal saja.
 */
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
        // Sticky — hanya bekerja jika parent tidak overflow-hidden
        "sticky top-0 z-10",
        // Background dengan blur untuk efek frosted glass
        "bg-neutral-50/95 dark:bg-neutral-950/95",
        "backdrop-blur-sm",
        // Layout
        "flex items-center justify-between",
        "px-4 py-2",
        // Border hanya bawah, tipis
        "border-b border-gray-100 dark:border-neutral-800/60",
        className,
      ].join(" ")}
    >
      {/* Label — uppercase, tracking lebar, ukuran sangat kecil */}
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400 dark:text-gray-500">
        {label}
      </span>

      {/* Subtotal — hanya tampil jika ada nilai */}
      {showSubtotal && formattedSubtotal && (
        <span
          className={[
            "text-[11px] font-mono font-medium tabular-nums",
            subtotalColor(subtotal),
          ].join(" ")}
        >
          {formattedSubtotal}
        </span>
      )}
    </div>
  );
}