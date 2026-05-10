import { useConfirmStore, type ConfirmOptions } from "@/store/ConfirmStore";

/**
 * Hook untuk memunculkan confirmation dialog dari mana saja.
 *
 * Penggunaan paling simpel:
 * ```tsx
 * const confirm = useConfirm();
 *
 * confirm({
 *   title: "Hapus transaksi?",
 *   onConfirm: () => deleteTransaction(id),
 * });
 * ```
 *
 * Dengan opsi lengkap:
 * ```tsx
 * confirm({
 *   title: "Keluar dari akun?",
 *   description: "Sesi Anda akan berakhir dan Anda perlu login kembali.",
 *   confirmLabel: "Ya, Keluar",
 *   cancelLabel: "Batal",
 *   variant: "danger",
 *   icon: <LogoutIcon />,
 *   onConfirm: async () => await signOut(),
 *   onCancel: () => console.log("cancelled"),
 * });
 * ```
 */
export function useConfirm() {
  const open = useConfirmStore((s) => s.open);
  return (options: ConfirmOptions) => open(options);
}