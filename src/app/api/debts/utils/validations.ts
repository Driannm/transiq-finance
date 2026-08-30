import { z } from "zod";

export const createDebtSchema = z.object({
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
  name: z.string().min(1, "Nama utang/deskripsi wajib diisi").max(255),
  creditor: z.string().min(1, "Pemberi utang wajib diisi").max(255),
  category: z.enum(["personal", "credit_card", "bank", "family", "other"]),
  totalAmount: z.number().positive("Total utang harus lebih besar dari 0"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  notes: z.string().max(1000).optional().nullable(),
  installment: z.boolean().default(false),
});

export const updateDebtSchema = createDebtSchema.partial();

export const createPaymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
  notes: z.string().max(255).optional().nullable(),
});