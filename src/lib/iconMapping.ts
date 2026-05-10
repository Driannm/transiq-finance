// src/lib/iconMapping.ts
import {
  // Category icons
  ShoppingBag01Icon,
  Home01Icon,
  Car01Icon,
  SparklesIcon,
  ShoppingBasket03Icon,
  TaskDaily01Icon,
  RiceBowl01Icon,
  VideoReplayIcon,
  BadmintonShuttleIcon,
  MoneySavingJarIcon,
  Cardiogram02Icon,
  Shirt01Icon,
  InternetIcon,
  Diamond02Icon,
  Dumbbell01Icon,
  GraduationScrollIcon,
  MoreHorizontalIcon,
  Wallet02Icon,
  Invoice01Icon,
  GiftIcon,
  DollarCircleIcon,
  AiGameIcon,
  Store01Icon,
  Coffee01Icon,
  Store04Icon,
  SmartPhone01Icon,
  Tv01Icon,
  GlobalIcon,
  Train01Icon,
  FuelStationIcon,
  Ticket01Icon,
  DeliveryBox01Icon,
} from "@hugeicons/core-free-icons";

// ─── Types ───────────────────────────────────────────────────────────────────

type HugeIcon = typeof ShoppingBag01Icon;

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

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, CategoryMapping> = {
  // 🍜 Makanan & Minuman
  "food & drink": { icon: RiceBowl01Icon, group: "Makanan & Minuman" },
  groceries: { icon: ShoppingBasket03Icon, group: "Makanan & Minuman" },
  "cafe & restaurant": { icon: Coffee01Icon, group: "Makanan & Minuman" },

  // 🛍️ Belanja & Fashion
  shopping: { icon: ShoppingBag01Icon, group: "Belanja & Fashion" },
  "fashion & accessories": { icon: Shirt01Icon, group: "Belanja & Fashion" },
  "household items": { icon: Home01Icon, group: "Belanja & Fashion" },
  "laundry services": { icon: Shirt01Icon, group: "Belanja & Fashion" },

  // 🚗 Transportasi
  transport: { icon: Car01Icon, group: "Transportasi" },
  "vehicle expenses": { icon: Car01Icon, group: "Transportasi" },

  // 🎮 Hiburan & Gaming
  "digital recreation": { icon: VideoReplayIcon, group: "Hiburan & Gaming" },
  "hobbies & recreation": {
    icon: BadmintonShuttleIcon,
    group: "Hiburan & Gaming",
  },
  "digital gaming expenses": { icon: AiGameIcon, group: "Hiburan & Gaming" },
  "game items": { icon: Diamond02Icon, group: "Hiburan & Gaming" },

  // 💪 Kesehatan & Kebugaran
  "health & wellness": {
    icon: Cardiogram02Icon,
    group: "Kesehatan & Kebugaran",
  },
  "fitness & sport": { icon: Dumbbell01Icon, group: "Kesehatan & Kebugaran" },
  "personal care": { icon: SparklesIcon, group: "Kesehatan & Kebugaran" },

  // 💡 Tagihan & Utilitas
  utilities: { icon: TaskDaily01Icon, group: "Tagihan & Utilitas" },
  "google services": { icon: InternetIcon, group: "Tagihan & Utilitas" },
  "taxes & fee": { icon: DollarCircleIcon, group: "Tagihan & Utilitas" },

  // 📚 Pendidikan & Kerja
  education: { icon: GraduationScrollIcon, group: "Pendidikan & Kerja" },
  "work & office supplies": {
    icon: Invoice01Icon,
    group: "Pendidikan & Kerja",
  },

  // 💰 Keuangan
  savings: { icon: MoneySavingJarIcon, group: "Keuangan" },
  "cash withdrawals": { icon: Wallet02Icon, group: "Keuangan" },

  // 🎁 Lainnya
  "gift & donations": { icon: GiftIcon, group: "Lainnya" },
  miscellaneous: { icon: MoreHorizontalIcon, group: "Lainnya" },
};

// ─── Merchant Config ─────────────────────────────────────────────────────────

const MERCHANT_CONFIG: Record<string, { icon: HugeIcon; group: string }> = {
  // 🛒 E-Commerce
  "tiktok shop": { icon: ShoppingBag01Icon, group: "E-Commerce" },
  tokopedia: { icon: ShoppingBag01Icon, group: "E-Commerce" },
  shopee: { icon: ShoppingBag01Icon, group: "E-Commerce" },
  "online platform": { icon: GlobalIcon, group: "E-Commerce" },
  "website platform": { icon: GlobalIcon, group: "E-Commerce" },

  // 🍜 Food & Beverage
  "food court": { icon: RiceBowl01Icon, group: "Makanan & Minuman" },
  "cafe & restaurant": { icon: Coffee01Icon, group: "Makanan & Minuman" },
  shopeefood: { icon: DeliveryBox01Icon, group: "Makanan & Minuman" },

  // 🎟️ Travel & Entertainment
  "tiket.com": { icon: Ticket01Icon, group: "Hiburan & Travel" },
  "cgv cinema": { icon: Tv01Icon, group: "Hiburan & Travel" },

  // 📱 Digital Services
  "app store": { icon: SmartPhone01Icon, group: "Digital & Teknologi" },
  "google services": { icon: InternetIcon, group: "Digital & Teknologi" },
  steam: { icon: AiGameIcon, group: "Digital & Teknologi" },
  mytelkomsel: { icon: SmartPhone01Icon, group: "Digital & Teknologi" },

  // ⛽ Transport & Fuel
  mypertamina: { icon: FuelStationIcon, group: "Kendaraan & BBM" },
  "gas station": { icon: FuelStationIcon, group: "Kendaraan & BBM" },
  gojek: { icon: Car01Icon, group: "Transportasi" },
  grab: { icon: Car01Icon, group: "Transportasi" },
  "access by kai": { icon: Train01Icon, group: "Transportasi" },

  // 🏪 Retail
  "klik indomaret": { icon: Store04Icon, group: "Ritel & Toko" },
  "store & minimarket": { icon: Store04Icon, group: "Ritel & Toko" },
  "offline merchant": { icon: Store01Icon, group: "Ritel & Toko" },
};

// ─── Derived Maps (backward compatibility) ───────────────────────────────────

export const CATEGORY_MAP: Record<string, HugeIcon> = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, { icon }]) => [key, icon])
);

export const CATEGORY_GROUP_MAP: Record<string, CategoryGroup> =
  Object.fromEntries(
    Object.entries(CATEGORY_CONFIG).map(([key, { group }]) => [key, group])
  );

export const MERCHANT_MAP: Record<string, HugeIcon> = Object.fromEntries(
  Object.entries(MERCHANT_CONFIG).map(([key, { icon }]) => [key, icon])
);

export const MERCHANT_GROUP_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MERCHANT_CONFIG).map(([key, { group }]) => [key, group])
);

// ─── Lookup Functions ────────────────────────────────────────────────────────

export function getCategoryIcon(categoryName?: string | null): HugeIcon {
  if (!categoryName) return ShoppingBag01Icon;
  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_CONFIG[key]) return CATEGORY_CONFIG[key].icon;
  for (const [k, { icon }] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return icon;
  }
  return ShoppingBag01Icon;
}

export function getCategoryGroup(categoryName?: string | null): CategoryGroup {
  if (!categoryName) return "Lainnya";
  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_CONFIG[key]) return CATEGORY_CONFIG[key].group;
  for (const [k, { group }] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return group;
  }
  return "Lainnya";
}

export function getMerchantIcon(merchantName?: string | null): HugeIcon {
  if (!merchantName) return Store01Icon;
  const key = merchantName.toLowerCase().trim();
  if (MERCHANT_CONFIG[key]) return MERCHANT_CONFIG[key].icon;
  for (const [k, { icon }] of Object.entries(MERCHANT_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return icon;
  }
  return Store01Icon;
}

export function getMerchantGroup(merchantName?: string | null): string {
  if (!merchantName) return "Lainnya";
  const key = merchantName.toLowerCase().trim();
  if (MERCHANT_CONFIG[key]) return MERCHANT_CONFIG[key].group;
  for (const [k, { group }] of Object.entries(MERCHANT_CONFIG)) {
    if (key.includes(k) || k.includes(key)) return group;
  }
  return "Lainnya";
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function getAllCategoryGroups(): CategoryGroup[] {
  const groups = new Set<CategoryGroup>();
  for (const { group } of Object.values(CATEGORY_CONFIG)) groups.add(group);
  return Array.from(groups).sort();
}

export function getAllMerchantGroups(): string[] {
  const groups = new Set<string>();
  for (const { group } of Object.values(MERCHANT_CONFIG)) groups.add(group);
  return Array.from(groups).sort();
}

export function getCategoriesByGroup(
  group: CategoryGroup
): Array<{ key: string; name: string; icon: HugeIcon }> {
  return Object.entries(CATEGORY_CONFIG)
    .filter(([, { group: g }]) => g === group)
    .map(([key, { icon }]) => ({
      key,
      name: key
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getMerchantsByGroup(
  group: string
): Array<{ key: string; name: string; icon: HugeIcon }> {
  return Object.entries(MERCHANT_CONFIG)
    .filter(([, { group: g }]) => g === group)
    .map(([key, { icon }]) => ({
      key,
      name: key
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export { CATEGORY_CONFIG, MERCHANT_CONFIG };
export type { HugeIcon };
