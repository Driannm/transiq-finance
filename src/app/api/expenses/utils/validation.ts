// src/app/api/expenses/utils/validation.ts
import { z } from "zod";

export const createExpenseSchema = z.object({
  cardId: z.string().min(1, "Kartu wajib dipilih"),
  name: z.string().min(1, "Nama expense wajib diisi").max(255),
  date: z.string().min(1, "Tanggal wajib diisi"),
  subtotal: z.number().positive("Subtotal minimal Rp 1"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  categoryId: z.string().optional().nullable(),
  merchantId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;