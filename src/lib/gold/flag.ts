import { prisma } from "@/lib/prisma"; // sesuaikan dengan lokasi Prisma client Anda

export const GOLD_FLAG_KEY = "gold_prices";

/**
 * Prioritas: baris di tabel FeatureFlag (kalau ada) > env GOLD_ENABLED.
 * Fail-closed: jika DB error, fitur dianggap mati.
 */
export async function isGoldEnabled(): Promise<boolean> {
  try {
    const row = await prisma.featureFlag.findUnique({
      where: { key: GOLD_FLAG_KEY },
    });
    if (row) return row.enabled;
  } catch {
    return false;
  }
  return process.env.GOLD_ENABLED === "true";
}
