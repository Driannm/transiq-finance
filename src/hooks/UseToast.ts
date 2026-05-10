import { useToastStore, type ToastOptions } from "@/store/ToastStore";

/**
 * Hook untuk menampilkan toast dari mana saja.
 *
 * Penggunaan minimal:
 * ```tsx
 * const toast = useToast();
 * toast.show({ title: "Transaksi disimpan" });
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
 *   icon:        <HugeiconsIcon icon={CheckIcon} size={22} />,
 *   iconBg:      "bg-green-500",
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
  const { show, hide, clear } = useToastStore();
  return { show, hide, clear };
}