export type IconEntry = {
  id: string;
  label: string;
  category: "saving" | "bill" | "general";
};

export const ICON_REGISTRY: IconEntry[] = [
  // Saving goals
  { id: "PiggyBankIcon",       label: "Tabungan",      category: "saving"  },
  { id: "Home01Icon",          label: "Rumah",          category: "saving"  },
  { id: "Car01Icon",           label: "Kendaraan",      category: "saving"  },
  { id: "Airplane01Icon",      label: "Liburan",        category: "saving"  },
  { id: "GraduationCapIcon",   label: "Pendidikan",     category: "saving"  },
  { id: "Diamond01Icon",       label: "Perhiasan",      category: "saving"  },
  { id: "SmartphoneIcon",      label: "Gadget",         category: "saving"  },
  { id: "BabyBottle01Icon",    label: "Dana Anak",      category: "saving"  },
  { id: "HeartCheckIcon",      label: "Darurat",        category: "saving"  },
  { id: "Building03Icon",      label: "Bisnis",         category: "saving"  },
  // Bills
  { id: "ElectricPlugIcon",    label: "Listrik",        category: "bill"    },
  { id: "WifiIcon",            label: "Internet",       category: "bill"    },
  { id: "CreditCardIcon",      label: "Tagihan",        category: "bill"    },
  { id: "DropletIcon",         label: "Air",            category: "bill"    },
  { id: "ShoppingCart01Icon",  label: "Belanja",        category: "bill"    },
  // General
  { id: "StarIcon",            label: "Lainnya",        category: "general" },
];

export const ICON_LABEL_MAP: Record<string, string> = Object.fromEntries(
  ICON_REGISTRY.map(({ id, label }) => [id, label])
);
