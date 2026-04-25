"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";

// ─── Types ─────────────────────────────────────

export interface QuickAddItem {
  label: string;
  icon: IconSvgElement;

  /** Optional navigation */
  path?: string;

  /** Optional custom handler */
  onClick?: () => void;

  /** Styling */
  iconClassName?: string;
  containerClassName?: string;
}

export interface QuickAddGridProps {
  items: QuickAddItem[];
  columns?: number;
}

// ─── Component ─────────────────────────────────

export function QuickAddGrid({
  items,
  columns = 4,
}: QuickAddGridProps) {
  const router = useRouter();

  const handleClick = (item: QuickAddItem) => {
    if (item.onClick) return item.onClick();
    if (item.path) return router.push(item.path);

    // kalau gak ada apa-apa → error (biar lu sadar)
    console.warn(`QuickAdd "${item.label}" has no action`);
  };

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => handleClick(item)}
          className="flex flex-col items-center gap-2 active:scale-95 transition"
        >
          <div
            className={`
              w-13 h-13 rounded-xl
              flex items-center justify-center
              bg-white dark:bg-gray-900 shadow-sm
              ${item.containerClassName || ""}
            `}
          >
            <HugeiconsIcon
              icon={item.icon}
              size={26}
              className={item.iconClassName || "text-gray-700"}
            />
          </div>

          <span className="text-[11px] font-medium text-gray-500 text-center">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}