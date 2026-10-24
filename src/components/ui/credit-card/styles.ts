// ─── DAFTAR TIPE ──────────────────────────────────────────────────────────────

export const NORMAL_TYPES = [
  "transparent-gradient",
  "transparent-gradient-blue",
  "transparent-gradient-purple",
  "transparent-gradient-sunset",
  "brand-dark",
  "brand-light",
  "gray-dark",
  "gray-light",
  "bank-jago-yellow",
  "bca-blue",
] as const;

export const STRIP_TYPES = [
  "transparent-strip",
  "gray-strip",
  "gradient-strip",
  "salmon-strip",
] as const;

export const VERTICAL_STRIP_TYPES = [
  "gray-strip-vertical",
  "gradient-strip-vertical",
  "salmon-strip-vertical",
  "shopee-strip-vertical",
  "gopay-strip-vertical",
] as const;

// Gaya yang memakai logo Mastercard berwarna
const COLOR_LOGO_TYPES = [
  "brand-dark",
  "brand-light",
  "gray-dark",
  "gray-light",
] as const;

// Gaya yang area logonya berlatar terang (logo Visa memakai warna biru tua)
const LIGHT_LOGO_TYPES = [
  "brand-light",
  "gray-light",
  "bank-jago-yellow",
  "salmon-strip-vertical",
] as const;

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

  // Normal (Debit / Bank)
  "brand-dark": {
    root: `bg-linear-to-tr from-brand-900 to-brand-700 ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bca-blue": {
    root: `bg-linear-to-tr from-[#0066AE] to-[#004C8C] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "bank-jago-yellow": {
    root: `bg-linear-to-tr from-[#FFD600] to-[#E6B800] ${SHINE} ${RING_LIGHT}`,
    company: "text-black",
    footerText: "text-black",
    paypassIcon: "text-black",
    cardTypeRoot: "bg-white/10",
  },
  "gray-dark": {
    root: `bg-linear-to-tr from-neutral-900 to-neutral-700 ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "brand-light": {
    root: `bg-brand-100 ${SHINE} ${RING_DARK}`,
    company: "text-neutral-700",
    footerText: "text-neutral-700",
    paypassIcon: "text-white",
    cardTypeRoot: "bg-white",
  },
  "gray-light": {
    root: `bg-neutral-100 ${SHINE} ${RING_DARK}`,
    company: "text-neutral-700",
    footerText: "text-neutral-700",
    paypassIcon: "text-neutral-400",
    cardTypeRoot: "bg-white",
  },

  // Strip horizontal (Paylater)
  "transparent-strip": {
    root: `bg-linear-to-br from-white/30 to-transparent backdrop-blur-[6px] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "gray-strip": {
    root: `bg-neutral-100 ${SHINE} ${RING_LIGHT}`,
    company: "text-neutral-700",
    footerText: "text-white",
    paypassIcon: "text-neutral-400",
    cardTypeRoot: "bg-white/10",
  },
  "gradient-strip": {
    root: `bg-linear-to-b from-[#A5C0EE] to-[#FBC5EC] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "salmon-strip": {
    root: `bg-[#F4D9D0] ${SHINE} ${RING_LIGHT}`,
    company: "text-neutral-700",
    footerText: "text-white",
    paypassIcon: "text-white",
    cardTypeRoot: "bg-white/10",
  },

  // Strip vertical (E-Wallet)
  "gray-strip-vertical": {
    root: `bg-linear-to-br from-white/30 to-transparent ${SHINE} ${RING_LIGHT}`,
    company: "text-white",
    footerText: "text-white",
    paypassIcon: "text-neutral-400",
    cardTypeRoot: "bg-white/10",
  },
  "gradient-strip-vertical": {
    root: `bg-linear-to-b from-[#FBC2EB] to-[#A18CD1] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "salmon-strip-vertical": {
    root: `bg-[#F4D9D0] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "shopee-strip-vertical": {
    root: `bg-[#EE4D2D] ${SHINE} ${RING_LIGHT}`,
    ...WHITE_TEXT,
  },
  "gopay-strip-vertical": {
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
