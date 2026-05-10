import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastPosition = "top" | "bottom";
export type ToastVariant  = "default" | "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  icon?: React.ReactNode;       // Custom icon — bisa JSX apapun
  iconBg?: string;              // Override background icon, e.g. "bg-red-500"
  duration?: number;            // ms, default 3500. 0 = tidak auto-dismiss
  position?: ToastPosition;     // "top" | "bottom", default "bottom"
  variant?: ToastVariant;       // Warna accent, default "default"
  action?: {
    label?: string;             // Teks tombol aksi (default: tampilkan chevron saja)
    onPress: () => void;
  };
  onDismiss?: () => void;
}

export interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastState {
  toasts: ToastItem[];
  show:   (options: ToastOptions) => string;   // return id
  hide:   (id: string) => void;
  clear:  () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (options) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({
      toasts: [
        ...s.toasts.filter((t) => t.id !== id),
        { ...options, id },
      ],
    }));
    return id;
  },

  hide: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear: () => set({ toasts: [] }),
}));