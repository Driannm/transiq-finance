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
  className?: string;
  iconSize?: number;
  /** Tampilkan label teks di bawah ikon (default: false) */
  showLabel?: boolean;
  /** Warna ikon saat aktif (default: "#111111" jika dark mode) */
  activeIconColor?: string;
  /** Warna ikon saat tidak aktif */
  inactiveIconColor?: string;
  /** Warna latar belakang navbar */
  backgroundColor?: string;
  /** Apakah menggunakan efek bulatan membesar (pill) atau hanya indikator garis */
  variant?: "pill" | "indicator";
}

export function BottomNav({
  items,
  className = "",
  iconSize = 22,
  showLabel = false,
  activeIconColor = "#111111",
  inactiveIconColor = "rgba(255,255,255,0.65)",
  backgroundColor = "bg-neutral-900 dark:bg-neutral-800",
  variant = "pill",
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handlePress = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const isActive = (path: string) => pathname === path;

  // Gaya latar belakang dinamis
  const bgClass = backgroundColor.startsWith("bg-") ? backgroundColor : "";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center
        pb-[max(env(safe-area-inset-bottom),16px)]
        px-6 pointer-events-none ${className}`}
    >
      <nav
        role="navigation"
        aria-label="Bottom navigation"
        className={`pointer-events-auto relative flex items-center
          ${bgClass || "bg-neutral-900 dark:bg-neutral-800"}
          rounded-full
          shadow-[0_8px_32px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.18)]
          px-2 py-2
          gap-1`}
        style={backgroundColor && !backgroundColor.startsWith("bg-") ? { backgroundColor } : undefined}
      >
        {items.map((item) => {
          const active = isActive(item.path);
          const isPillVariant = variant === "pill";

          return (
            <button
              key={item.path}
              onClick={() => handlePress(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                transition-all duration-300 active:scale-90"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {active && isPillVariant ? (
                // Aktif dengan bulatan besar (pill)
                <span
                  className="flex items-center justify-center
                    w-[58px] h-[58px] -my-3
                    rounded-full bg-white
                    shadow-[0_2px_12px_rgba(0,0,0,0.18)]
                    transition-all duration-300"
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    width={iconSize + 2}
                    height={iconSize + 2}
                    color={activeIconColor}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1
                      rounded-full bg-red-500 text-white text-[8px] font-bold
                      flex items-center justify-center leading-none">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
              ) : (
                // Tidak aktif atau variant indicator
                <span
                  className={`flex flex-col items-center justify-center
                    w-[46px] min-h-[46px]
                    rounded-full
                    transition-all duration-200
                    hover:bg-white/10 active:bg-white/15
                    ${!isPillVariant && active ? "text-white" : ""}`}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    width={iconSize}
                    height={iconSize}
                    color={active ? activeIconColor : inactiveIconColor}
                  />
                  {/* Label teks (opsional) */}
                  {showLabel && (
                    <span
                      className={`text-[10px] font-medium mt-0.5 ${
                        active ? "text-white" : "text-white/60"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                  {/* Badge */}
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1
                      rounded-full bg-red-500 text-white text-[8px] font-bold
                      flex items-center justify-center leading-none">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
              )}

              {/* Indikator garis bawah jika variant = indicator dan aktif */}
              {!isPillVariant && active && (
                <span className="absolute -bottom-1 w-6 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}