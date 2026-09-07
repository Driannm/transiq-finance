import { ReactNode } from "react";

export type BalanceHeaderVariant =
  | "yellow"
  | "red"
  | "green"
  | "emerald"
  | "rose"
  | "indigo";

export interface MonthSelectorConfig {
  currentMonth: string; // ISO format "yyyy-MM" or fully formatted string
  onPrev: () => void;
  onNext: () => void;
  style?: "sleek" | "minimal";
}

export interface ProgressConfig {
  percentage: number;
  labelLeft?: string;
  labelRight?: string | ReactNode;
}

export interface PrivacyToggleConfig {
  isHidden: boolean;
  onToggle: () => void;
  maskText?: string;
}

export interface TrendConfig {
  value: string; // e.g. "12.5%"
  isPositive?: boolean; // true = up (green), false = down (red)
  label?: string; // e.g. "vs bulan lalu"
}

export interface SecondaryAmountConfig {
  label: string;
  amount: number;
  type?: "positive" | "negative" | "neutral";
  currency?: string;
}

export interface BalanceHeaderProps {
  label: string;
  amount: number;
  variant: BalanceHeaderVariant;
  isLoading?: boolean;
  currency?: string;

  // Add-ons
  monthSelector?: MonthSelectorConfig;
  progress?: ProgressConfig;
  privacyToggle?: PrivacyToggleConfig;
  trend?: TrendConfig;
  secondaryAmount?: SecondaryAmountConfig;
  topRightAction?: ReactNode;
  badges?: ReactNode[];

  className?: string;
}
