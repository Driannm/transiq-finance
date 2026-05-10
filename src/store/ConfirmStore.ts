import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmVariant = "danger" | "warning" | "safe";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isLoading: boolean;

  open: (options: ConfirmOptions) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen:    false,
  options:   null,
  isLoading: false,

  open: (options) =>
    set({ isOpen: true, options, isLoading: false }),

  close: () =>
    set({ isOpen: false, options: null, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));