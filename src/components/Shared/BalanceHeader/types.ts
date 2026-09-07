import { ReactNode } from "react";

export type BalanceHeaderVariant =
  | "yellow"
  | "red"
  | "green"
  | "emerald"
  | "rose"
  | "indigo";

export interface BalanceHeaderProps {
  label: string;
  amount: number;
  variant: BalanceHeaderVariant;
  isLoading?: boolean;
  monthSelector?: {
    currentMonth: string; // ISO format "yyyy-MM" or fully formatted string
    onPrev: () => void;
    onNext: () => void;
    style?: "sleek" | "minimal";
  };
  progress?: {
    percentage: number;
    labelLeft?: string;
    labelRight?: string | ReactNode;
  };
  badges?: ReactNode[];
  className?: string;
}
