import { z } from "zod";

export const createCardSchema = z.object({
  name: z.string().min(1, "Nama kartu wajib diisi").max(255),
  type: z.enum(["BANK", "EMONEY", "EWALLET", "PAYLATER"]),
  balance: z.coerce.number().default(0),
  cutoffDay: z.coerce.number().min(1).max(31).optional().nullable(),
  dueOffset: z.coerce.number().min(0).optional().nullable(),
  dueDay: z.coerce.number().min(1).max(31).optional().nullable(),
});

export const updateCardSchema = createCardSchema.partial();

export const transferSchema = z.object({
  fromCardId: z.string().min(1, "Kartu asal wajib dipilih"),
  toCardId: z.string().min(1, "Kartu tujuan wajib dipilih"),
  amount: z.coerce.number().positive("Jumlah transfer harus lebih besar dari 0"),
  fee: z.coerce.number().nonnegative("Biaya admin tidak boleh negatif").optional().default(0),
  date: z.string().optional().nullable(),
});
