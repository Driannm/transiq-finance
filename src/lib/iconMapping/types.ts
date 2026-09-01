// src/lib/iconMapping/types.ts
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";

// Type trick to capture the exact React functional component type from Hugeicons
export type HugeIcon = typeof ShoppingBag01Icon;

export type CategoryGroup =
  | "Makanan & Minuman"
  | "Belanja & Fashion"
  | "Transportasi"
  | "Hiburan & Gaming"
  | "Kesehatan & Kebugaran"
  | "Tagihan & Utilitas"
  | "Pendidikan & Kerja"
  | "Keuangan"
  | "Lainnya";

export interface CategoryMapping {
  icon: HugeIcon;
  group: CategoryGroup;
}
