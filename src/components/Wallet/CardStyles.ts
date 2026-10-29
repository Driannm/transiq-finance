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
      { value: "bank-default-dark", label: "Hitam" },
      { value: "bank-blue", label: "Biru" },
      { value: "bank-yellow", label: "Kuning" },
      { value: "bank-light-blue", label: "Biru Muda" },
      { value: "bank-red", label: "Merah" },
      { value: "bank-purple", label: "Ungu" },
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
      { value: "ewallet-default", label: "Putih" },
      { value: "ewallet-orange", label: "Orange" },
      { value: "ewallet-light-blue", label: "Biru Muda" },
      { value: "ewallet-red", label: "Merah" },
      { value: "ewallet-purple", label: "Ungu" },
    ],
  },
  PAYLATER: {
    label: "Paylater",
    familyLabel: "Strip Horizontal",
    supportsNetwork: false,
    options: [
      { value: "paylater-light-blue", label: "Biru Muda" },
      { value: "paylater-yellow", label: "Kuning" },
      { value: "paylater-orange", label: "Orange" },
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
