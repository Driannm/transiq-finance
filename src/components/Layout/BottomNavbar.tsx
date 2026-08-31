"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  Cancel01Icon,
  MoneyReceive02Icon,
  MoneySend02Icon,
  ArrowDataTransferHorizontalIcon,
  CreditCardIcon,
  Money02Icon,
} from "@hugeicons/core-free-icons";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BottomNavItem {
  label: string;
  icon: IconSvgElement;
  path: string;
  badge?: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
}

// ─── Quick Add Actions ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    id: "expense",
    label: "Expense",
    icon: MoneySend02Icon,
    path: "/expenses/add",
    color: "bg-red-500",
    angle: 160, // derajat dari bawah, arc ke kiri-atas
  },
  {
    id: "income",
    label: "Income",
    icon: MoneyReceive02Icon,
    path: "/income/add",
    color: "bg-emerald-500",
    angle: 130,
  },
  {
    id: "transfer",
    label: "Transfer",
    icon: ArrowDataTransferHorizontalIcon,
    path: "/transfers/add",
    color: "bg-blue-500",
    angle: 100,
  },
  {
    id: "debt",
    label: "Hutang",
    icon: CreditCardIcon,
    path: "/debts/add",
    color: "bg-orange-500",
    angle: 70,
  },
  {
    id: "loan",
    label: "Piutang",
    icon: Money02Icon,
    path: "/loans/add",
    color: "bg-violet-500",
    angle: 40,
  },
] as const;

const RADIUS = 88; // px — jarak tombol dari FAB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function angleToXY(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: -Math.sin(rad) * radius, // negatif karena Y axis CSS terbalik
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handlePress = useCallback(
    (path: string) => router.push(path),
    [router],
  );

  // Tutup saat back/navigate
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Tutup saat tap di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-bottom-nav]")) setOpen(false);
    };
    document.addEventListener("touchstart", handler);
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Backdrop blur — hanya saat open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAVBAR ── */}
      <div
        data-bottom-nav
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 flex items-center justify-center gap-2 pointer-events-none px-4"
      >
        <nav
          role="tablist"
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
                role="tab"
                aria-selected={active}
                onClick={() => handlePress(item.path)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[56px] h-11 rounded-[24px]
                  transition-all duration-300 active:scale-95
                  ${active ? "bg-white/10" : "bg-transparent"}
                `}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  className={`transition-colors duration-300 ${active ? "text-white" : "text-neutral-500"}`}
                />
                <span
                  className={`text-[9px] mt-0.5 font-medium leading-none transition-colors duration-300 ${active ? "text-white" : "text-neutral-500"}`}
                >
                  {item.label}
                </span>
                {item.badge != null && item.badge > 0 && (
                  <>
                    <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="sr-only">Ada pemberitahuan</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── FAB + Radial Menu ── */}
        <div className="pointer-events-auto relative" data-bottom-nav>
          {/* Radial action buttons */}
          <AnimatePresence>
            {open &&
              QUICK_ACTIONS.map((action, i) => {
                const { x, y } = angleToXY(action.angle, RADIUS);
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 32,
                      mass: 0.7,
                      delay: open
                        ? i * 0.04
                        : (QUICK_ACTIONS.length - 1 - i) * 0.03,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ pointerEvents: open ? "auto" : "none" }}
                  >
                    <button
                      aria-label={action.label}
                      onClick={() => {
                        setOpen(false);
                        router.push(action.path);
                      }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      {/* Label */}
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 + 0.08, duration: 0.15 }}
                        className="
                        text-[10px] font-semibold text-white
                        bg-neutral-900/80 backdrop-blur-sm
                        px-2 py-0.5 rounded-full border border-white/10
                        whitespace-nowrap
                      "
                      >
                        {action.label}
                      </motion.span>

                      {/* Icon button */}
                      <div
                        className={`
                        w-11 h-11 rounded-full flex items-center justify-center
                        ${action.color}
                        shadow-lg active:scale-95
                        transition-transform duration-150
                        ring-2 ring-white/20
                      `}
                      >
                        <HugeiconsIcon
                          icon={action.icon}
                          size={19}
                          className="text-white"
                        />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* FAB */}
          <motion.button
            onClick={() => setOpen((v) => !v)}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Menu Aksi Cepat"
            aria-haspopup="true"
            aria-expanded={open}
            className="
              w-12 h-12 rounded-full
              flex items-center justify-center
              backdrop-blur-2xl bg-neutral-900/80
              border border-white/10
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
            "
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={20}
                className="text-white"
              />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </>
  );
}
