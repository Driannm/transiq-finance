"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { useCallback } from "react";

export interface BottomNavItem {
  label: string;
  icon: IconSvgElement;
  path: string;
  badge?: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  iconSize?: number;
  showLabel?: boolean;
}

export function BottomNav({
  items,
  iconSize = 22,
  showLabel = false,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handlePress = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const isActive = (path: string) => pathname === path;

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        flex justify-center
        pointer-events-none
        pb-[max(env(safe-area-inset-bottom),16px)]
      "
    >
      <nav
        className="
          pointer-events-auto
          flex items-center gap-1 px-2 py-2
          rounded-full
          backdrop-blur-xl bg-white/30
          border border-white/50
          shadow-sm
        "
      >
        {items.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handlePress(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="
                relative flex flex-col items-center justify-center
                w-11 h-11
                rounded-full
                transition-all duration-200
                active:scale-90
              "
            >
              {/* Active background (subtle, bukan pill gede) */}
              <span
                className={`
                  absolute inset-0 rounded-full transition
                  ${active ? "bg-white/40" : "bg-transparent"}
                `}
              />

              <HugeiconsIcon
                icon={item.icon}
                width={iconSize}
                height={iconSize}
                color={active ? "#111827" : "rgba(20,20,30,0.6)"}
              />

              {showLabel && (
                <span
                  className={`
                    text-[10px] mt-0.5 font-medium
                    ${active ? "text-gray-900" : "text-gray-500"}
                  `}
                >
                  {item.label}
                </span>
              )}

              {/* Badge */}
              {item.badge != null && item.badge > 0 && (
                <span className="
                  absolute top-1 right-1
                  min-w-[14px] h-[14px] px-1
                  rounded-full bg-red-500 text-white
                  text-[8px] font-bold flex items-center justify-center
                ">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}