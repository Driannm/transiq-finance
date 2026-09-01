// src/lib/iconMapping/debt.ts
import {
  UserIcon,
  CreditCardIcon,
  BankIcon,
  UserGroupIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./types";

export type DebtCategory = "personal" | "credit_card" | "bank" | "family" | "other" | string;

export const DEBT_CATEGORY_CONFIG: Record<string, { icon: HugeIcon; label: string }> = {
  personal: { icon: UserIcon, label: "Personal" },
  credit_card: { icon: CreditCardIcon, label: "Kartu Kredit" },
  bank: { icon: BankIcon, label: "Bank" },
  family: { icon: UserGroupIcon, label: "Keluarga" },
  other: { icon: MoreHorizontalIcon, label: "Lainnya" },
};

export function getDebtCategoryIcon(category?: string | null): HugeIcon {
  if (!category) return MoreHorizontalIcon;
  const key = category.toLowerCase().trim();
  if (DEBT_CATEGORY_CONFIG[key]) return DEBT_CATEGORY_CONFIG[key].icon;
  return MoreHorizontalIcon;
}

export function getDebtCategoryLabel(category?: string | null): string {
  if (!category) return "Lainnya";
  const key = category.toLowerCase().trim();
  if (DEBT_CATEGORY_CONFIG[key]) return DEBT_CATEGORY_CONFIG[key].label;
  return "Lainnya";
}
