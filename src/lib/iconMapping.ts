import {
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
} from "@hugeicons/core-free-icons";

type HugeIcon = typeof ShoppingBag01Icon;

// Diubah menjadi lowercase semua agar pencocokan lebih konsisten
const categoryNameMap: Record<string, HugeIcon> = {
  "household items": Home01Icon,
  "personal care": SparklesIcon,
  "groceries": ShoppingBasket03Icon,
  "utilities": TaskDaily01Icon,
  "food & drink": RiceBowl01Icon,
  "digital recreation": VideoReplayIcon,
  "hobbies & recreation": BadmintonShuttleIcon,
  "transport": Car01Icon,
  "savings": MoneySavingJarIcon,
  "shopping": ShoppingBag01Icon,
  "health & wellness": Cardiogram02Icon,
  "laundry services": Shirt01Icon,
  "google services": InternetIcon,
  "game items": Diamond02Icon,
  "fitness & sport": Dumbbell01Icon,
  "education": GraduationScrollIcon,
  "fashion & accessories": Shirt01Icon,
  "miscellaneous": MoreHorizontalIcon,
  "cash withdrawals": Wallet02Icon,
  "work & office supplies": Invoice01Icon,
  "gift & donations": GiftIcon,
  "vehicle expenses": Car01Icon,
  "taxes & fee": DollarCircleIcon,
  "digital gaming expenses": AiGameIcon,
};

export function getCategoryIcon(categoryName?: string | null): HugeIcon {
  if (!categoryName) return ShoppingBag01Icon;

  const key = categoryName.toLowerCase().trim();

  // 1. Prioritaskan exact match
  if (categoryNameMap[key]) {
    return categoryNameMap[key];
  }

  // 2. Fallback ke substring (jika tidak ada yang persis)
  for (const [keyword, icon] of Object.entries(categoryNameMap)) {
    if (key.includes(keyword) || keyword.includes(key)) {
      return icon;
    }
  }

  return ShoppingBag01Icon;
}
