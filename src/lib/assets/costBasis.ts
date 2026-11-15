// src/lib/assets/costBasis.ts — aturan Section 16 (Addendum). Fungsi murni.
export type NoCashEntry = "OPENING" | "RECEIVE";

export function resolveCostBasis(
  type: NoCashEntry,
  currentValue: number,
  costBasisInput?: number | null,
): number {
  if (type === "RECEIVE") return currentValue; // fair value saat diterima
  // OPENING: harga beli awal jika diisi, jika tidak pakai current value.
  return costBasisInput != null ? costBasisInput : currentValue;
}
