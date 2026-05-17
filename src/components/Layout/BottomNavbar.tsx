"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useState } from "react";

export interface BottomNavItem {
  label: string;
  icon: IconSvgElement;
  path: string;
  badge?: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handlePress = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ── QUICK ADD SHEET ────────────────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end"
          onClick={() => setSheetOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="
              relative z-50 w-full
              rounded-t-[28px]
              bg-neutral-900
              border-t border-white/10
              px-5 pt-4 pb-8
              animate-slide-up
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 w-10 h-1 rounded-full bg-white/20" />

            <div className="flex items-center justify-between mb-5">
              <span className="text-white font-semibold text-base">
                Tambah Baru
              </span>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-white/70" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Judul</label>
                <input
                  type="text"
                  inputMode="text"
                  autoFocus
                  placeholder="Tulis judul..."
                  className="
                    w-full rounded-xl bg-white/8 border border-white/10
                    px-4 py-3 text-sm text-white placeholder:text-white/30
                    outline-none focus:border-white/25
                  "
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Catatan</label>
                <textarea
                  inputMode="text"
                  placeholder="Tambahkan catatan..."
                  rows={3}
                  className="
                    w-full rounded-xl bg-white/8 border border-white/10
                    px-4 py-3 text-sm text-white placeholder:text-white/30
                    outline-none focus:border-white/25 resize-none
                  "
                />
              </div>

              <button
                className="
                  w-full mt-1 py-3 rounded-xl
                  bg-white text-neutral-900 font-semibold text-sm
                  active:scale-95 transition-transform
                "
                onClick={() => setSheetOpen(false)}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAVBAR ──────────────────────────────────────────────────── */}
      <div
        className="
          fixed bottom-4 left-0 right-0 z-50
          flex items-center justify-center gap-2
          pointer-events-none px-4
        "
      >
        <nav
          className="
            pointer-events-auto
            flex items-center gap-0.5 p-1.5
            rounded-[32px]
            backdrop-blur-sm bg-neutral-900/80
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
                  min-w-[56px] h-11 rounded-[24px]
                  transition-all duration-300 active:scale-90
                  ${active ? "bg-white/10" : "bg-transparent"}
                `}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  className={`transition-colors duration-300 ${
                    active ? "text-white" : "text-neutral-500"
                  }`}
                />
                <span
                  className={`
                    text-[9px] mt-0.5 font-medium leading-none transition-colors duration-300
                    ${active ? "text-white" : "text-neutral-500"}
                  `}
                >
                  {item.label}
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setSheetOpen(true)}
          className="
            pointer-events-auto w-12 h-12 rounded-full
            flex items-center justify-center
            backdrop-blur-2xl bg-neutral-900/80
            border border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            active:scale-90 transition-transform group
          "
        >
          <HugeiconsIcon
            icon={Add01Icon}
            size={20}
            className={`transition-transform duration-300 ${
              sheetOpen ? "rotate-45" : "group-hover:rotate-90"
            } text-white`}
          />
        </button>
      </div>
    </>
  );
}