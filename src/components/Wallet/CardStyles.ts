import type {
  CardLogo,
  CreditCardType,
} from "@/components/ui/credit-card/credit-card";

export type CardType = "BANK" | "EMONEY" | "EWALLET" | "PAYLATER";

export interface StyleOption {
  value: CreditCardType;
  label: string;
}

export interface CardTypeConfig {
  /** Nama jenis kartu */
  label: string;
  /** Nama gaya tampilan yang dikunci untuk jenis ini */
  familyLabel: string;
  /** Pilihan warna (urutan pertama = default) */
  options: StyleOption[];
  /** Hanya Debit/Bank yang boleh memilih jaringan pembayaran */
  supportsNetwork: boolean;
}

// Aturan: jenis kartu -> gaya -> pilihan warna
export const CARD_TYPE_CONFIG: Record<CardType, CardTypeConfig> = {
  BANK: {
    label: "Debit",
    familyLabel: "Normal",
    supportsNetwork: true,
    options: [
      { value: "brand-dark", label: "Hitam" },
      { value: "bca-blue", label: "Biru" },
      { value: "bank-jago-yellow", label: "Kuning" },
      { value: "gray-dark", label: "Abu Gelap" },
      { value: "brand-light", label: "Biru Muda" },
      { value: "gray-light", label: "Abu Terang" },
    ],
  },
  EMONEY: {
    label: "E-Money",
    familyLabel: "Transparent Gradient",
    supportsNetwork: false,
    options: [
      { value: "transparent-gradient", label: "Pelangi" },
      { value: "transparent-gradient-blue", label: "Biru" },
      { value: "transparent-gradient-purple", label: "Ungu" },
      { value: "transparent-gradient-sunset", label: "Senja" },
    ],
  },
  EWALLET: {
    label: "E-Wallet",
    familyLabel: "Strip Vertical",
    supportsNetwork: false,
    options: [
      { value: "shopee-strip-vertical", label: "Oranye" },
      { value: "gopay-strip-vertical", label: "Cyan" },
      { value: "gradient-strip-vertical", label: "Gradient" },
      { value: "salmon-strip-vertical", label: "Salmon" },
      { value: "gray-strip-vertical", label: "Abu" },
    ],
  },
  PAYLATER: {
    label: "Paylater",
    familyLabel: "Strip Horizontal",
    supportsNetwork: false,
    options: [
      { value: "gradient-strip", label: "Gradient" },
      { value: "salmon-strip", label: "Salmon" },
      { value: "gray-strip", label: "Abu" },
    ],
  },
};

export const CARD_TYPE_ORDER: CardType[] = [
  "BANK",
  "EMONEY",
  "EWALLET",
  "PAYLATER",
];

export const NETWORK_OPTIONS: { value: CardLogo; label: string }[] = [
  { value: "mastercard", label: "Mastercard" },
  { value: "visa", label: "Visa" },
  { value: "jago", label: "Jago" },
  { value: "bca", label: "BCA" },
  { value: "none", label: "Tanpa logo" },
];

/** Index warna dalam jenis kartu; fallback ke 0 kalau style tidak cocok dengan jenisnya */
export const getStyleIndex = (
  type: CardType,
  style?: string | null,
): number => {
  const idx = CARD_TYPE_CONFIG[type].options.findIndex(
    (o) => o.value === style,
  );
  return idx >= 0 ? idx : 0;
};

/** Gaya yang dipakai untuk menampilkan kartu (aman untuk data lama) */
export const resolveCardStyle = (
  type: CardType,
  style?: string | null,
): CreditCardType =>
  CARD_TYPE_CONFIG[type].options[getStyleIndex(type, style)].value;

/** Logo jaringan hanya untuk Debit/Bank; jenis lain selalu tanpa logo */
export const resolveCardLogo = (
  type: CardType,
  logo?: CardLogo | null,
): CardLogo =>
  CARD_TYPE_CONFIG[type].supportsNetwork ? (logo ?? "mastercard") : "none";

// Animasi & ambang swipe (dipakai bersama oleh Wallet Page dan Card Editor)
export const SWIPE_DISTANCE = 60;
export const SWIPE_VELOCITY = 500;

export const cardSlideVariants = {
  enter: (direction: "left" | "right") => ({
    x: direction === "right" ? 150 : -150,
    opacity: 0,
    scale: 0.96,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: "left" | "right") => ({
    x: direction === "right" ? -150 : 150,
    opacity: 0,
    scale: 0.96,
  }),
};
