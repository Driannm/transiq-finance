import { z } from "zod";

export const CARD_TYPES = ["BANK", "EMONEY", "EWALLET", "PAYLATER"] as const;
export const CARD_SCOPES = ["PERSONAL", "FAMILY", "BUSINESS"] as const;

const STYLES_BY_TYPE: Record<(typeof CARD_TYPES)[number], string[]> = {
  BANK: [
    "brand-dark",
    "bca-blue",
    "bank-jago-yellow",
    "gray-dark",
    "brand-light",
    "gray-light",
  ],
  EMONEY: [
    "transparent-gradient",
    "transparent-gradient-blue",
    "transparent-gradient-purple",
    "transparent-gradient-sunset",
  ],
  EWALLET: [
    "shopee-strip-vertical",
    "gopay-strip-vertical",
    "gradient-strip-vertical",
    "salmon-strip-vertical",
    "gray-strip-vertical",
  ],
  PAYLATER: ["gradient-strip", "salmon-strip", "gray-strip"],
};
const LOGOS = ["mastercard", "visa", "jago", "bca", "none"] as const;

export const createCardSchema = z.object({
  name: z.string().min(1, "Nama kartu wajib diisi").max(255),
  type: z.enum(CARD_TYPES),
  balance: z.coerce.number().default(0),
  scope: z.enum(CARD_SCOPES).default("PERSONAL"),
  stakeholder: z.string().trim().max(100).optional().nullable(),
  cutoffDay: z.coerce.number().min(1).max(31).optional().nullable(),
  dueOffset: z.coerce.number().min(0).optional().nullable(),
  dueDay: z.coerce.number().min(1).max(31).optional().nullable(),
  style: z.string().optional().nullable(),
  logo: z.enum(LOGOS).optional().nullable(),
});

/**
 * Pastikan style cocok dengan jenis kartu, dan logo jaringan
 * hanya dipakai untuk BANK. Nilai yang tidak valid dijadikan null/"none".
 */
export function normalizeAppearance(
  type: (typeof CARD_TYPES)[number],
  style?: string | null,
  logo?: string | null,
) {
  return {
    style: style && STYLES_BY_TYPE[type].includes(style) ? style : null,
    logo: type === "BANK" ? (logo ?? "mastercard") : "none",
  };
}

export const updateCardSchema = createCardSchema.partial();

export const transferSchema = z.object({
  fromCardId: z.string().min(1, "Kartu asal wajib dipilih"),
  toCardId: z.string().min(1, "Kartu tujuan wajib dipilih"),
  amount: z.coerce
    .number()
    .positive("Jumlah transfer harus lebih besar dari 0"),
  fee: z.coerce
    .number()
    .nonnegative("Biaya admin tidak boleh negatif")
    .optional()
    .default(0),
  date: z.string().optional().nullable(),
});
