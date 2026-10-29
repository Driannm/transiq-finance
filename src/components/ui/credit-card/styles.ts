// ─── DAFTAR TIPE ──────────────────────────────────────────────────────────────

export const NORMAL_TYPES = [
  "transparent-gradient",
  "transparent-gradient-blue",
  "transparent-gradient-purple",
  "transparent-gradient-sunset",
  "bank-default-dark",
  "bank-red",
  "bank-light-blue",
  "bank-purple",
  "bank-yellow",
  "bank-blue",
] as const;

export const STRIP_TYPES = [
  "paylater-default",
  "paylater-orange",
  "paylater-light-blue",
  "paylater-yellow",
] as const;

export const VERTICAL_STRIP_TYPES = [
  "ewallet-default",
  "ewallet-red",
  "ewallet-purple",
  "ewallet-orange",
  "ewallet-light-blue",
] as const;

// Gaya yang memakai logo Mastercard berwarna
const COLOR_LOGO_TYPES = [
  "bank-default-dark",
  "bank-red",
  "bank-light-blue",
  "bank-purple",
  "bank-blue",
  "bank-yellow",
] as const;

// Gaya yang area logonya berlatar terang (logo Visa memakai warna biru tua)
const LIGHT_LOGO_TYPES = ["bank-red", "bank-purple", "ewallet-purple"] as const;

export type CreditCardType =
  | (typeof NORMAL_TYPES)[number]
  | (typeof STRIP_TYPES)[number]
  | (typeof VERTICAL_STRIP_TYPES)[number];

export type CardLogo = "mastercard" | "visa" | "jago" | "bca" | "none";

// Helper pengecekan (menghindari `as` berulang di komponen)
const has = (list: readonly string[], type: string) => list.includes(type);

export const isStripType = (t: CreditCardType) => has(STRIP_TYPES, t);
export const isVerticalStripType = (t: CreditCardType) =>
  has(VERTICAL_STRIP_TYPES, t);
export const usesColorLogo = (t: CreditCardType) => has(COLOR_LOGO_TYPES, t);
export const hasLightLogoBg = (t: CreditCardType) => has(LIGHT_LOGO_TYPES, t);

// ─── BAGIAN KELAS YANG DIPAKAI BERSAMA ────────────────────────────────────────

const SHINE =
  "before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-inset";
const RING_LIGHT = "before:ring-white/30";
const RING_DARK = "before:ring-black/10";

interface CardTheme {
  root: string;
  company: string;
  footerText: string;
  paypassIcon: string;
  cardTypeRoot: string;
}

// Teks putih (dipakai kebanyakan gaya)
const WHITE_TEXT = {
  company: "text-white",
  footerText: "text-white",
  paypassIcon: "text-white",
  cardTypeRoot: "bg-white/10",
};

const GLASS_ROOT = `bg-neutral-900 bg-linear-to-br from-white/15 to-transparent ${SHINE} ${RING_LIGHT}`;

// ─── WARNA PER GAYA ───────────────────────────────────────────────────────────

export const CARD_STYLES: Record<CreditCardType, CardTheme> = {
  // Transparent gradient (E-Money)
  "transparent-gradient": { root: GLASS_ROOT, ...WHITE_TEXT },
  "transparent-gradient-blue": { root: GLASS_ROOT, ...WHITE_TEXT },
  "transparent-gradient-purple": { root: GLASS_ROOT, ...WHITE_TEXT },
  "transparent-gradient-sunset": { root: GLASS_ROOT, ...WHITE_TEXT },

  // Theme Bank
  "bank-default-dark": {
    root: `bg-linear-to-tr from-brand-900 to-brand-700 ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bank-blue": {
    root: `bg-linear-to-tr from-[#0066AE] to-[#0066AE] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bank-yellow": {
    root: `bg-linear-to-tr from-[#FFD600] to-[#FFD600] ${SHINE} ${RING_LIGHT}`,
    company: "text-black",
    footerText: "text-black",
    paypassIcon: "text-black",
    cardTypeRoot: "bg-black/10",
  },
  "bank-light-blue": {
    root: `bg-linear-to-tr from-[#30cfd2] to-[#30cfd2] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bank-red": {
    root: `bg-linear-to-tr from-[#d82327] to-[#d82327] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bank-purple": {
    root: `bg-linear-to-tr from-[#172b8c] to-[#172b8c] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },

  // Strip horizontal (Paylater)
  "paylater-default": {
    root: `bg-linear-to-br from-white/30 to-transparent backdrop-blur-[6px] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "paylater-orange": {
    root: `bg-[#EE4D2D] ${SHINE} ${RING_LIGHT}`,
    company: "text-white",
    footerText: "text-white",
    paypassIcon: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "paylater-light-blue": {
    root: `bg-[#00AED6] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "paylater-yellow": {
    root: `bg-[#FFD600] ${SHINE} ${RING_LIGHT}`,
    company: "text-black",
    footerText: "text-white",
    paypassIcon: "text-white",
    cardTypeRoot: "bg-white/10",
  },

  // Strip vertical (E-Wallet)
  "ewallet-default": {
    root: `bg-[#f5f5f5] ${SHINE} ${RING_LIGHT}`,
    company: "text-white",
    footerText: "text-white",
    paypassIcon: "text-neutral-400",
    cardTypeRoot: "bg-white/10",
  },
  "ewallet-red": {
    root: `bg-[#e82529] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "ewallet-purple": {
    root: `bg-[#4c3395] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "ewallet-orange": {
    root: `bg-[#EE4D2D] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "ewallet-light-blue": {
    root: `bg-[#00AED6] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
};

// ─── WARNA BLOB (TRANSPARENT GRADIENT) ────────────────────────────────────────

export const GLASS_BLOBS: Partial<
  Record<CreditCardType, [string, string, string, string]>
> = {
  "transparent-gradient": [
    "bg-pink-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
  ],
  "transparent-gradient-blue": [
    "bg-sky-400",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-cyan-400",
  ],
  "transparent-gradient-purple": [
    "bg-fuchsia-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-pink-400",
  ],
  "transparent-gradient-sunset": [
    "bg-orange-500",
    "bg-rose-500",
    "bg-amber-400",
    "bg-pink-500",
  ],
};
