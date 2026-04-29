"use client";

/**
 * IconPicker — lets user choose an icon from a curated registry.
 *
 * Usage:
 *   <IconPicker value={iconId} onChange={setIconId} category="saving" />
 */

import {
  PiggyBankIcon,
  Home01Icon,
  Car01Icon,
  Airplane01Icon,
  GraduationCap,             // ✅ perbaikan: bukan GraduationCapIcon
  Diamond01Icon,
  SmartPhoneIcon,            // ✅ SmartphoneIcon -> SmartPhoneIcon
  BabyBottleIcon,            // ✅ BabyBottle01Icon -> BabyBottleIcon
  HeartCheckIcon,
  Building03Icon,
  ElectricPlugsIcon,         // ✅ ElectricPlugIcon -> ElectricPlugsIcon
  Wifi01Icon,
  CreditCardIcon,
  DropletIcon,
  ShoppingCart01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement} from "@hugeicons/react";
import { ICON_REGISTRY } from "./icon-registry";
import { cn } from "@/lib/utils";

// ─── ikon map ──────────────────────────────────────────────────────────────
const ICON_COMPONENT_MAP: Record<string, IconSvgElement> = {
  PiggyBankIcon,
  Home01Icon,
  Car01Icon,
  Airplane01Icon,
  GraduationCapIcon:  GraduationCap,      // mapping dari id registry ke objek ikon
  Diamond01Icon,
  SmartphoneIcon:     SmartPhoneIcon,
  BabyBottle01Icon:   BabyBottleIcon,
  HeartCheckIcon,
  Building03Icon,
  ElectricPlugIcon:   ElectricPlugsIcon,
  WifiIcon:           Wifi01Icon,
  CreditCardIcon,
  DropletIcon,
  ShoppingCart01Icon,
  StarIcon,
};

// ─── types ─────────────────────────────────────────────────────────────────
type IconEntry = {
  id: string;
  label: string;
  category: "saving" | "bill" | "general";
};

type IconPickerProps = {
  value: string | null;
  onChange: (iconId: string) => void;
  category?: IconEntry["category"] | "all";
  className?: string;
};

// ─── component ─────────────────────────────────────────────────────────────
export function IconPicker({
  value,
  onChange,
  category = "all",
  className,
}: IconPickerProps) {
  const filtered =
    category === "all"
      ? ICON_REGISTRY
      : ICON_REGISTRY.filter((icon) => icon.category === category);

  return (
    <div
      className={cn(
        "grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8",
        className
      )}
      role="radiogroup"
      aria-label="Pilih icon"
    >
      {filtered.map(({ id, label }) => {
        const iconSvg = ICON_COMPONENT_MAP[id]; // IconSvgElement | undefined
        const isSelected = value === id;

        if (!iconSvg) return null; // jangan render jika tidak ada

        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[11px] font-medium transition-all duration-150",
              "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground",
              isSelected &&
                "border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/20"
            )}
          >
            <HugeiconsIcon icon={iconSvg} size={22} strokeWidth={1.5} />
            <span className="truncate w-full text-center leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── resolver (mengembalikan objek ikon untuk digunakan di tempat lain) ────
export function resolveIcon(iconId: string): IconSvgElement | null {
  return ICON_COMPONENT_MAP[iconId] ?? null;
}