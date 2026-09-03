import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastPosition = "top" | "bottom";
export type ToastVariant  = "default" | "success" | "warning" | "danger" | "info";
export type ToastStatus   = "idle" | "loading" | "success" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  icon?: React.ReactNode;       // Custom icon — bisa JSX apapun
  iconBg?: string;              // Override background icon, e.g. "bg-red-500"
  duration?: number;            // ms, default 3500. 0 = tidak auto-dismiss
  position?: ToastPosition;     // "top" | "bottom", default "top"
  variant?: ToastVariant;       // Warna accent, default "default"
  status?: ToastStatus;         // "idle" | "loading" | "success" | "error"
  action?: {
    label?: string;             // Teks tombol aksi (default: tampilkan chevron saja)
    onPress: () => void;
  };
  onDismiss?: () => void;
}

export interface ToastItem extends ToastOptions {
  id: string;
}

export interface PromiseMessages {
  loading: string;
  success: string;
  error:   string;
}

interface ToastState {
  toasts: ToastItem[];
  show:    (options: ToastOptions) => string;
  update:  (id: string, partial: Partial<ToastOptions>) => void;
  hide:    (id: string) => void;
  clear:   () => void;
  promise: <T>(
    fn: () => Promise<T>,
    messages: PromiseMessages,
    options?: Partial<ToastOptions>,
  ) => Promise<T>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useToastStore = create<ToastState>((set, get) => ({
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

  update: (id, partial) => {
    set((s) => ({
      toasts: s.toasts.map((t) =>
        t.id === id ? { ...t, ...partial } : t,
      ),
    }));
  },

  hide: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear: () => set({ toasts: [] }),

  promise: async (fn, messages, options = {}) => {
    const { show, update, hide } = get();

    // 1. Show loading toast — no auto-dismiss
    const id = show({
      title:    messages.loading,
      variant:  "default",
      status:   "loading",
      duration: 0,
      position: options.position ?? "top",
      ...options,
    });

    try {
      const result = await fn();

      // 2. Transition to success in-place
      update(id, {
        title:       messages.success,
        description: undefined,
        variant:     "success",
        status:      "success",
        duration:    3500,
        icon:        undefined, // let variant default icon take over
        iconBg:      undefined,
      });

      // Auto-dismiss after duration
      setTimeout(() => hide(id), 3500);

      return result;
    } catch (err: unknown) {
      const description =
        err instanceof Error ? err.message : "Terjadi kesalahan";

      // 3. Transition to error in-place
      update(id, {
        title:       messages.error,
        description,
        variant:     "danger",
        status:      "error",
        duration:    4000,
        icon:        undefined,
        iconBg:      undefined,
      });

      setTimeout(() => hide(id), 4000);

      throw err;
    }
  },
}));