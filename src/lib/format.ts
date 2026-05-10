/**
 * Format angka ke format Rupiah singkat.
 * Contoh: 1500000 → "Rp 1,5 jt"
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
   * Format ISO date string ke "12 Jun 2025"
   */
  export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  }
  
  /**
   * Hitung persentase progress (0–100)
   */
  export function calcProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }
  
  /**
   * Hitung sisa hari ke deadline
   */
  export function daysUntil(deadline: string): number {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  