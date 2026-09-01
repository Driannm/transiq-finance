// src/lib/iconMapping/loan.ts
import {
  UserIcon,
  UserGroupIcon,
  Briefcase01Icon,
  CreditCardIcon,
  ClipboardIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./types";

export type LoanCategory = "personal" | "family" | "colleague" | "bank" | "credit_card" | "other" | string;

export const LOAN_CATEGORY_CONFIG: Record<string, { icon: HugeIcon; label: string }> = {
  personal: { icon: UserIcon, label: "Personal" },
  family: { icon: UserGroupIcon, label: "Keluarga" },
  colleague: { icon: Briefcase01Icon, label: "Rekan Kerja" },
  bank: { icon: CreditCardIcon, label: "Pinjaman Bank" },
  credit_card: { icon: CreditCardIcon, label: "Kartu Kredit" },
  other: { icon: ClipboardIcon, label: "Lainnya" },
};

export function getLoanCategoryIcon(category?: string | null): HugeIcon {
  if (!category) return ClipboardIcon;
  const key = category.toLowerCase().trim();
  if (LOAN_CATEGORY_CONFIG[key]) return LOAN_CATEGORY_CONFIG[key].icon;
  return ClipboardIcon;
}

export function getLoanCategoryLabel(category?: string | null): string {
  if (!category) return "Lainnya";
  const key = category.toLowerCase().trim();
  if (LOAN_CATEGORY_CONFIG[key]) return LOAN_CATEGORY_CONFIG[key].label;
  return "Lainnya";
}
