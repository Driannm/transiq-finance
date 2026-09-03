import { useToastStore, type ToastOptions, type PromiseMessages } from "@/store/ToastStore";

/**
 * Hook untuk menampilkan toast dari mana saja.
 *
 * Penggunaan minimal:
 * ```tsx
 * const toast = useToast();
 * toast.show({ title: "Transaksi disimpan" });
 * ```
 *
 * **Promise toast** (loading → success/error in-place):
 * ```tsx
 * await toast.promise(
 *   () => fetch("/api/loans", { method: "POST", body: ... }).then(r => r.json()),
 *   {
 *     loading: "Menyimpan...",
 *     success: "Berhasil disimpan",
 *     error:   "Gagal menyimpan",
 *   }
 * );
 * ```
 *
 * Dengan semua opsi:
 * ```tsx
 * toast.show({
 *   title:       "Transaksi disimpan",
 *   description: "IDR 150.000 berhasil dicatat",
 *   variant:     "success",
 *   position:    "top",
 *   duration:    4000,
 *   action: {
 *     label:   "Lihat",
 *     onPress: () => router.push("/transactions"),
 *   },
 * });
 * ```
 *
 * Dismiss manual:
 * ```tsx
 * const id = toast.show({ title: "Memproses...", duration: 0 });
 * await doSomething();
 * toast.hide(id);
 * ```
 */
export function useToast() {
  const { show, update, hide, clear, promise } = useToastStore();
  return { show, update, hide, clear, promise };
}