// src/lib/iconMapping/income.ts
import {
  GiftIcon,
  Building03Icon,
  LaptopIcon,
  BriefcaseDollarIcon,
  Briefcase01Icon,
  BadgeDollarSignIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./types";

export const INCOME_SOURCE_CONFIG: Record<string, { icon: HugeIcon; label: string }> = {
  gift: { icon: GiftIcon, label: "Gift" },
  business: { icon: Building03Icon, label: "Business" },
  freelance: { icon: LaptopIcon, label: "Freelance" },
  investment: { icon: BriefcaseDollarIcon, label: "Investment" },
  salary: { icon: Briefcase01Icon, label: "Salary" },
  other: { icon: BadgeDollarSignIcon, label: "Other" },
};

export function getIncomeSourceIcon(source?: string | null): HugeIcon {
  if (!source) return BadgeDollarSignIcon;
  const key = source.toLowerCase().trim();
  if (INCOME_SOURCE_CONFIG[key]) return INCOME_SOURCE_CONFIG[key].icon;
  return BadgeDollarSignIcon;
}

export function getIncomeSourceLabel(source?: string | null): string {
  if (!source) return "Other";
  const key = source.toLowerCase().trim();
  if (INCOME_SOURCE_CONFIG[key]) return INCOME_SOURCE_CONFIG[key].label;
  return "Other";
}
