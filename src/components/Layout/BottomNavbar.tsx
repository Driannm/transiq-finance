"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
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

// Kaca ala iOS: terang di light mode, gelap di dark mode.
// Tanpa border; tepi dibentuk highlight tipis di atas dan bawah.
const glass = [
  "bg-white/70 supports-[backdrop-filter]:bg-white/50",
  "dark:bg-neutral-900/85 dark:supports-[backdrop-filter]:bg-neutral-900/55",
  "backdrop-blur-xl backdrop-saturate-150",
  "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.45)]",
  "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.05)]",
].join(" ");

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

  // Tab yang baru ditekan: dipakai supaya animasi langsung jalan tanpa
  // menunggu halaman tujuan selesai dimuat (pathname baru berubah belakangan).
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const reduceMotion = useReducedMotion();

  // Satu spring untuk semua perubahan ukuran dan posisi: tab melebar,
  // tab lain menyempit, dan seluruh navbar menyesuaikan lebarnya.
  const layoutSpring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 };

  const handlePress = useCallback(
    (path: string) => {
      setPendingPath(path);
      router.push(path);
    },
    [router],
  );

  // Halaman sudah berganti: pakai pathname sebagai sumber kebenaran
  useEffect(() => {
    setPendingPath(null);
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

  const currentPath = pendingPath ?? pathname;
  const isActive = (path: string) => currentPath === path;

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
        className="pointer-events-none fixed bottom-[max(0.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] left-0 right-0 z-50 flex items-center justify-center gap-2 px-4"
      >
        <motion.nav
          role="tablist"
          layout
          transition={{ layout: layoutSpring }}
          style={{ borderRadius: 9999 }}
          className={`pointer-events-auto flex items-center gap-0.5 p-1.5 ${glass}`}
        >
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                role="tab"
                aria-selected={active}
                aria-label={item.label}
                onClick={() => handlePress(item.path)}
                // `layout`: lebar tab dianimasikan lewat transform, bukan
                // mengubah ukuran tiap frame, jadi tetap mulus
                layout
                transition={{ layout: layoutSpring }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                style={{ borderRadius: 9999 }}
                className={`relative flex h-11 items-center justify-center transition-[background-color,box-shadow] duration-300 ${
                  active
                    ? "gap-2 bg-white px-4 shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] dark:bg-white/15 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                    : "w-11 bg-transparent"
                }`}
              >
                {/* Ikon */}
                <motion.span layout="position" className="flex">
                  <HugeiconsIcon
                    icon={item.icon}
                    size={20}
                    className={`transition-colors duration-300 ${
                      active
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  />
                </motion.span>

                {/* Label: hanya di tab aktif, di sisi kanan ikon */}
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      key="label"
                      layout="position"
                      initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          duration: reduceMotion ? 0 : 0.2,
                          delay: reduceMotion ? 0 : 0.06,
                          ease: "easeOut",
                        },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: reduceMotion ? 0 : 0.08 },
                      }}
                      className="whitespace-nowrap text-[13px] font-semibold leading-none text-neutral-900 dark:text-white"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge != null && item.badge > 0 && (
                  <>
                    <span className="absolute right-2 top-2 z-10 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="sr-only">Ada pemberitahuan</span>
                  </>
                )}
              </motion.button>
            );
          })}
        </motion.nav>

        {/* ── FAB + Radial Menu ── */}
        <motion.div
          layout="position"
          transition={{ layout: layoutSpring }}
          className="pointer-events-auto relative"
          data-bottom-nav
        >
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
                      className="group flex flex-col items-center gap-1.5"
                    >
                      {/* Label */}
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 + 0.08, duration: 0.15 }}
                        className="
                          whitespace-nowrap rounded-full
                          bg-neutral-900/60 px-2 py-0.5 text-[10px] font-semibold text-white
                          shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]
                          backdrop-blur-md backdrop-saturate-150
                        "
                      >
                        {action.label}
                      </motion.span>

                      {/* Icon button */}
                      <div
                        className={`
                          flex h-11 w-11 items-center justify-center rounded-full
                          ${action.color}
                          shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]
                          transition-transform duration-150 active:scale-95
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
            className={`flex h-[56px] w-[56px] items-center justify-center rounded-full ${glass}`}
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={22}
                className="text-neutral-900 dark:text-white"
              />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
