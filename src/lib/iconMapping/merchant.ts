// src/lib/iconMapping/merchant.ts
import {
  ShoppingBag01Icon,
  GlobalIcon,
  RiceBowl01Icon,
  Coffee01Icon,
  DeliveryBox01Icon,
  Ticket01Icon,
  Tv01Icon,
  SmartPhone01Icon,
  InternetIcon,
  AiGameIcon,
  FuelStationIcon,
  Car01Icon,
  Train01Icon,
  Store04Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./types";

export const MERCHANT_CONFIG: Record<string, { icon: HugeIcon; group: string }> = {
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

export const MERCHANT_MAP: Record<string, HugeIcon> = Object.fromEntries(
  Object.entries(MERCHANT_CONFIG).map(([key, { icon }]) => [key, icon])
);

export const MERCHANT_GROUP_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MERCHANT_CONFIG).map(([key, { group }]) => [key, group])
);

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

export function getAllMerchantGroups(): string[] {
  const groups = new Set<string>();
  for (const { group } of Object.values(MERCHANT_CONFIG)) groups.add(group);
  return Array.from(groups).sort();
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
