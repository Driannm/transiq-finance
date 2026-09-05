import { z } from "zod";

const DEBT_CATEGORIES = [
  "personal",
  "family",
  "colleague",
  "credit_card",
  "bank",
  "other",
] as const;

export const createDebtSchema = z
  .object({
    cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
    name: z.string().min(1, "Nama utang/deskripsi wajib diisi").max(255),
    creditor: z.string().min(1, "Pemberi utang wajib diisi").max(255),
    category: z.enum(DEBT_CATEGORIES).default("personal"),
    totalAmount: z.number().positive("Total utang harus lebih besar dari 0"),
    debtDate: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
    notes: z.string().max(1000).optional().nullable(),
    installment: z.boolean().default(false),
  })
  .transform((data) => ({
    ...data,
    debtDate:
      data.debtDate || data.date || new Date().toISOString().split("T")[0],
  }));

export const updateDebtSchema = z.object({
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih").optional(),
  name: z.string().min(1, "Nama utang/deskripsi wajib diisi").max(255).optional(),
  creditor: z.string().min(1, "Pemberi utang wajib diisi").max(255).optional(),
  category: z.enum(DEBT_CATEGORIES).optional(),
  totalAmount: z.number().positive("Total utang harus lebih besar dari 0").optional(),
  debtDate: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi").optional(),
  notes: z.string().max(1000).optional().nullable(),
  installment: z.boolean().default(false).optional(),
}).transform((data) => ({
  ...data,
  debtDate: data.debtDate || data.date || new Date().toISOString().split("T")[0],
}));

export const createPaymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
  notes: z.string().max(255).optional().nullable(),
});