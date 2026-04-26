"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons"; // Pastikan import plus icon
import { useCallback } from "react";

export interface BottomNavItem {
  label: string;
  icon: IconSvgElement;
  path: string;
  badge?: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  onPlusPress?: () => void; // Aksi untuk tombol plus
}

export function BottomNav({ items, onPlusPress }: BottomNavProps) {
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
        fixed bottom-8 left-0 right-0 z-50
        flex items-center justify-center gap-3
        pointer-events-none
        px-6
        pb-[env(safe-area-inset-bottom)]
      "
    >
      {/* Main Island Nav */}
      <nav
        className="
          pointer-events-auto
          flex items-center gap-1 p-2
          rounded-[32px]
          backdrop-blur-2xl bg-neutral-900/80
          border border-white/10
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        "
      >
        {items.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handlePress(item.path)}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[72px] h-14
                rounded-[24px]
                transition-all duration-300
                active:scale-90
                ${active ? "bg-white/10" : "bg-transparent"}
              `}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={22}
                className={`transition-colors duration-300 ${
                  active ? "text-white" : "text-neutral-500"
                }`}
              />
              
              <span
                className={`
                  text-[10px] mt-1 font-medium transition-colors duration-300
                  ${active ? "text-white" : "text-neutral-500"}
                `}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge != null && item.badge > 0 && (
                <span className="
                  absolute top-2 right-4
                  w-2 h-2
                  rounded-full bg-blue-500
                " />
              )}
            </button>
          );
        })}
      </nav>

      {/* Floating Action Button (FAB) - Plus Button */}
      <button
        onClick={onPlusPress}
        className="
          pointer-events-auto
          w-16 h-16
          rounded-full
          flex items-center justify-center
          backdrop-blur-2xl bg-neutral-900/80
          border border-white/10
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          active:scale-90 transition-transform
          group
        "
      >
        <HugeiconsIcon 
          icon={Add01Icon} 
          size={28} 
          className="text-white group-hover:rotate-90 transition-transform duration-300" 
        />
      </button>
    </div>
  );
}