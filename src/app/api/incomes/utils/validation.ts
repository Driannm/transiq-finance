import { z } from "zod";

export const createIncomeSchema = z.object({
  cardId: z.string().min(1, "Kartu wajib dipilih"),
  name: z.string().trim().min(1, "Nama income wajib diisi").max(255),
  date: z.iso.date("Tanggal tidak valid"),
  amount: z.number().finite().positive("Nominal minimal Rp 1"),
  source: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateIncomeSchema = createIncomeSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Minimal satu field harus diubah",
  );

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
