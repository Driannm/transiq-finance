/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Shared/CardList/types.ts
import { ReactNode } from "react";

export type LayoutVariant =
  | "dashboard"
  | "detailed"
  | "compact"
  | "minimal"
  | "loan";

/** Extended meta for the 'loan' variant */
export interface LoanItemMeta {
  remaining: number;
  totalAmount: number;
  returnedAmount: number;
  progressPercent: number;
  status: "active" | "ongoing" | "overdue" | "paid";
  debtor: string;
  category: "personal" | "family" | "colleague" | "other";
  dueDate: string;
  onRecordPayment?: () => void;
}

export type SwipeVariant =
  | "primary"
  | "danger"
  | "success"
  | "warning"
  | "neutral"
  | "indigo";

export interface SwipeAction {
  id: string;
  label: string;
  variant: SwipeVariant;
  icon: ReactNode;
  onExecute: (itemId: string | number) => void | Promise<void>;
  position?: "left" | "right";
  requiresConfirm?: boolean;
  confirmMessage?: string;
}

export interface SkeletonConfig {
  fields: (
    | "icon"
    | "title"
    | "subtitle"
    | "amount"
    | "date"
    | "badge"
    | "bottom"
  )[];
  count?: number;
}

export interface GroupConfig<T = any> {
  enabled: boolean;
  groupBy: (item: T) => string;
  renderHeader?: (groupKey: string, items: T[], subtotal: number) => ReactNode;
  showSubtotal?: boolean;
  subtotalFormatter?: (amount: number) => string;
  amountExtractor?: (item: T) => number; // ← tambah
  typeExtractor?: (item: T) => "expense" | "income" | "transfer" | undefined;
}

export interface CardItemRenderResult {
  left: ReactNode;
  right: ReactNode;
  bottom?: ReactNode;
  meta?: {
    date?: string;
    amount?: number;
    badge?: string;
    type?: "expense" | "income" | "transfer";
    loanData?: LoanItemMeta;
  };
}

export interface CardListProps<T = any> {
  items: T[];
  layout?: LayoutVariant;
  renderItem: (item: T, layout: LayoutVariant) => CardItemRenderResult;
  keyExtractor: (item: T, index: number) => string | number;

  // Interactions
  onItemPress?: (item: T) => void;
  swipeActions?: SwipeAction[];
  enableSwipe?: boolean;

  // Layout
  layoutVariants?: Partial<Record<LayoutVariant, { className?: string }>>;

  // Grouping
  grouping?: GroupConfig<T>;

  // Loading
  isLoading?: boolean;
  skeleton?: SkeletonConfig;

  // Empty
  emptyState?: EmptyStateProps | ReactNode;

  // Load More
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;

  // Styling
  className?: string;
  itemClassName?: string;
}

export interface EmptyStateAction {
  id: string;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  variant?: "card" | "inline";
  actions?: EmptyStateAction[];
}
