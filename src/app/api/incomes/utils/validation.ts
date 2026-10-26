// src/app/api/income/utils/validation.ts
import { z } from "zod";

export const createIncomeSchema = z.object({
  cardId: z.string().min(1, "Kartu wajib dipilih"),
  name: z.string().min(1, "Nama income wajib diisi").max(255),
  date: z.string().min(1, "Tanggal wajib diisi"),
  amount: z.number().positive("Nominal minimal Rp 1"),
  source: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;