import { z } from "zod";

export const ASSET_CATEGORIES = [
  "vehicle",
  "property",
  "electronics",
  "gold",
  "other",
] as const;
export const assetCategorySchema = z.enum(ASSET_CATEGORIES);

export type AssetStatus = "OWNED" | "SOLD" | "DISPOSED" | "GIFTED";
export type AssetActivityType =
  | "OPENING"
  | "PURCHASE"
  | "RECEIVE"
  | "SELL"
  | "DISPOSE"
  | "GIFT";

export const ENTRY_ACTIVITIES = ["OPENING", "PURCHASE", "RECEIVE"] as const;
export const EXIT_ACTIVITIES = ["SELL", "DISPOSE", "GIFT"] as const;

const EXIT_TO_STATUS = {
  SELL: "SOLD",
  DISPOSE: "DISPOSED",
  GIFT: "GIFTED",
} as const;

export class AssetLifecycleError extends Error {}

export function isOwned(a: { status: AssetStatus; deletedAt?: Date | null }) {
  return a.status === "OWNED" && !a.deletedAt;
}

/** Status baru setelah exit activity. Lempar error jika transisi tidak valid. */
export function nextStatusOnExit(
  current: AssetStatus,
  activity: AssetActivityType,
): Exclude<AssetStatus, "OWNED"> {
  if (!(activity in EXIT_TO_STATUS)) {
    throw new AssetLifecycleError(`${activity} bukan exit activity`);
  }
  if (current !== "OWNED") {
    throw new AssetLifecycleError(
      `Asset berstatus ${current} tidak dapat di-${activity.toLowerCase()} lagi`,
    );
  }
  return EXIT_TO_STATUS[activity as keyof typeof EXIT_TO_STATUS];
}

export function assertEntryActivity(type: AssetActivityType) {
  if (!(ENTRY_ACTIVITIES as readonly string[]).includes(type)) {
    throw new AssetLifecycleError(`${type} bukan entry activity`);
  }
}

/** Invariant status/exitedAt. Panggil sebelum menyimpan Asset. */
export function assertConsistent(a: {
  status: AssetStatus;
  exitedAt: Date | null;
}) {
  if (a.status === "OWNED" && a.exitedAt) {
    throw new AssetLifecycleError("Asset OWNED tidak boleh punya exitedAt");
  }
  if (a.status !== "OWNED" && !a.exitedAt) {
    throw new AssetLifecycleError(`Asset ${a.status} wajib punya exitedAt`);
  }
}
