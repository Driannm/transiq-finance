import { format, isValid } from "date-fns";

/**
 * Format ISO date string or Date object to "12 Jun 2025" in Indonesian locale.
 */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Safe date formatter with fallback if invalid.
 */
export function safeDate(
  iso: string | Date | null | undefined,
  formatStr: string,
  fallback = "—"
): string {
  if (!iso) return fallback;
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return isValid(d) ? format(d, formatStr) : fallback;
}

/**
 * Safe time formatter (HH:mm) with fallback.
 */
export function safeTime(
  dateStr: string | Date | null | undefined,
  fallback = "—"
): string {
  if (!dateStr) return fallback;
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return isValid(d) ? format(d, "HH:mm") : fallback;
}
