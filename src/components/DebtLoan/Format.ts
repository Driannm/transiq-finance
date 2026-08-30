// components/loans/add-loan/loan-format.ts

import {
  UserIcon,
  UserGroupIcon,
  Briefcase01Icon,
  ClipboardIcon,
  CreditCardIcon,
  Wallet02Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import type { ObligationCategory } from "./types";

export const CATEGORY_OPTIONS: {
  value: ObligationCategory;
  label: string;
  icon: typeof UserIcon;
}[] = [
  { value: "personal", label: "Personal", icon: UserIcon },
  { value: "family", label: "Keluarga", icon: UserGroupIcon },
  { value: "colleague", label: "Rekan Kerja", icon: Briefcase01Icon },
  { value: "bank", label: "Pinjaman Bank", icon: CreditCardIcon },
  { value: "credit_card", label: "Kartu Kredit", icon: CreditCardIcon },
  { value: "other", label: "Lainnya", icon: ClipboardIcon },
];

export const CARD_TYPE_LABELS: Record<string, string> = {
  BANK: "Rekening Bank",
  EWALLET: "E-Wallet / Dompet Digital",
  EMONEY: "E-Money / Uang Elektronik",
};

import {
  formatIDRInput as globalFormatIDRInput,
  parseAmount as globalParseAmount,
  formatIDR,
} from "@/lib/format";

export const formatIDRInput = globalFormatIDRInput;
export const parseAmount = globalParseAmount;
export function formatIDRDisplay(n: number): string {
  return formatIDR(n);
}

export function getCardIcon(cardType: string) {
  const t = (cardType || "BANK").toUpperCase();
  if (t === "EWALLET") return Wallet02Icon;
  if (t === "EMONEY") return SmartPhone01Icon;
  return CreditCardIcon;
}
