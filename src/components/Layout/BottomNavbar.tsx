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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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

// Kaca gelap ala iOS: tanpa border, highlight tipis di tepi atas dan bawah
const glass =
  "bg-neutral-900/85 supports-[backdrop-filter]:bg-neutral-900/55 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.05)]";

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

  const reduceMotion = useReducedMotion();
  const pillTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 36, mass: 0.8 };
  const iconTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 520, damping: 26 };

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
        className="fixed bottom-[max(0.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] left-0 right-0 z-50 flex items-center justify-center gap-2 pointer-events-none px-4"
      >
        <nav
          role="tablist"
          className={`
              pointer-events-auto
              flex items-center gap-0.5 p-1.5
              rounded-[32px]
              ${glass}
            `}
        >
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                role="tab"
                aria-selected={active}
                onClick={() => handlePress(item.path)}
                whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                className="relative flex h-11 min-w-[56px] flex-col items-center justify-center rounded-[24px]"
              >
                {/* Pil aktif: meluncur dari tab ke tab */}
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    aria-hidden
                    transition={pillTransition}
                    className="absolute inset-0 rounded-[24px] bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  />
                )}

                {/* Ikon: membesar dan naik sedikit saat aktif */}
                <motion.span
                  animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
                  transition={iconTransition}
                  className="relative z-10 flex"
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={18}
                    className={`transition-colors duration-300 ${active ? "text-white" : "text-neutral-500"}`}
                  />
                </motion.span>

                {/* Label: lebih terang saat aktif */}
                <motion.span
                  animate={{ opacity: active ? 1 : 0.75 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className={`relative z-10 mt-0.5 text-[9px] font-medium leading-none transition-colors duration-300 ${active ? "text-white" : "text-neutral-500"}`}
                >
                  {item.label}
                </motion.span>

                {item.badge != null && item.badge > 0 && (
                  <>
                    <span className="absolute right-3 top-2 z-10 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="sr-only">Ada pemberitahuan</span>
                  </>
                )}
              </motion.button>
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
                          bg-neutral-900/60 backdrop-blur-md backdrop-saturate-150
                          px-2 py-0.5 rounded-full
                          shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
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
                                                    shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]
                          active:scale-95
                          transition-transform duration-150
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
            className={`
                w-12 h-12 rounded-full
                flex items-center justify-center
                ${glass}
              `}
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
