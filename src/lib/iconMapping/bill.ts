// src/lib/iconMapping/bill.ts
import {
  TaskDaily01Icon,
  VideoReplayIcon,
  Home01Icon,
  Invoice01Icon,
  InternetIcon,
  MoreHorizontalIcon,
  ZapIcon,
  DropletIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./types";

export type BillCategory =
  | "utilities"
  | "electricity"
  | "water"
  | "subscription"
  | "rent"
  | "insurance"
  | "internet"
  | "other";

export interface BillCategoryConfig {
  icon: HugeIcon;
  label: string;
  bg: string;
  text: string;
}

export const BILL_CATEGORY_CONFIG: Record<BillCategory, BillCategoryConfig> = {
  utilities: {
    icon: TaskDaily01Icon,
    label: "Utilitas",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  electricity: {
    icon: ZapIcon,
    label: "Listrik",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  water: {
    icon: DropletIcon,
    label: "PDAM",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  subscription: {
    icon: VideoReplayIcon,
    label: "Langganan",
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  rent: {
    icon: Home01Icon,
    label: "Sewa Rumah",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  insurance: {
    icon: Invoice01Icon,
    label: "Asuransi",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  internet: {
    icon: InternetIcon,
    label: "Internet",
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
  },
  other: {
    icon: MoreHorizontalIcon,
    label: "Lainnya",
    bg: "bg-slate-100 dark:bg-slate-950/40",
    text: "text-slate-600 dark:text-slate-400",
  },
};

export const BILL_CATEGORY_OPTIONS = (
  Object.keys(BILL_CATEGORY_CONFIG) as BillCategory[]
).map((key) => ({
  value: key,
  label: BILL_CATEGORY_CONFIG[key].label,
  icon: BILL_CATEGORY_CONFIG[key].icon,
}));

export function getBillCategoryIcon(category?: string | null): HugeIcon {
  if (!category) return MoreHorizontalIcon;
  const key = category.toLowerCase().trim() as BillCategory;
  if (BILL_CATEGORY_CONFIG[key]) return BILL_CATEGORY_CONFIG[key].icon;
  return MoreHorizontalIcon;
}

export function getBillCategoryLabel(category?: string | null): string {
  if (!category) return "Lainnya";
  const key = category.toLowerCase().trim() as BillCategory;
  if (BILL_CATEGORY_CONFIG[key]) return BILL_CATEGORY_CONFIG[key].label;
  return "Lainnya";
}
