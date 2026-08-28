/**
 * Format number to Indonesian thousand separator format (e.g. 1.500.000).
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

/**
 * Format currency to short Rupiah format or full format (e.g. Rp 1.500.000 or Rp 1,5 jt).
 */
export function formatRupiah(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".0", "")} M`;
    }
    if (amount >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toFixed(1).replace(".0", "")} jt`;
    }
    if (amount >= 1_000) {
      return `Rp ${(amount / 1_000).toFixed(0)} rb`;
    }
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format string digits live to Indonesian thousand separator format.
 */
export function formatIDRInput(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

/**
 * Parse Indonesian thousand separator string back to number.
 */
export function parseAmount(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}
