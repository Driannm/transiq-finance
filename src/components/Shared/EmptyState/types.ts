// src/components/Shared/EmptyState/types.ts
import { ReactNode } from "react";

export type EmptyStateVariant = 'card' | 'inline';

export type EmptyStateActionVariant = 'primary' | 'secondary' | 'danger';

export interface EmptyStateAction {
  /** Unique identifier untuk action */
  id: string;
  
  /** Label teks pada button */
  label: string;
  
  /** Callback ketika button diklik */
  onPress: () => void;
  
  /** Style variant button */
  variant?: EmptyStateActionVariant;
}

export interface EmptyStateProps {
  /** Icon node (mis. <HugeiconsIcon icon={...} size={32} />) */
  icon: ReactNode;
  
  /** Judul utama empty state */
  title: string;
  
  /** Deskripsi penjelas di bawah judul */
  description: string;
  
  /** 
   * Variant container:
   * - 'card': pakai bg putih + border + shadow (default)
   * - 'inline': transparan, untuk nested content 
   */
  variant?: EmptyStateVariant;
  
  /** 
   * Multiple action buttons (opsional).
   * Akan dirender horizontal dengan gap.
   */
  actions?: EmptyStateAction[];
  action?: EmptyStateAction;
}