import { z } from "zod";

export const expenseBaseSchema = z.object({
  cardId: z.string().cuid("Kartu tidak valid"),
  name: z.string().trim().min(1, "Nama expense wajib diisi").max(255),
  date: z.string().date("Format tanggal harus YYYY-MM-DD"),
  subtotal: z.number().positive("Subtotal minimal Rp 1"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  fee: z.number().min(0).default(0),
  categoryId: z.string().cuid().optional().nullable(),
  merchantId: z.string().cuid().optional().nullable(),
  groupId: z.string().cuid("Grup tidak valid").or(z.literal("")).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const createExpenseSchema = expenseBaseSchema.refine(
  (data) => {
    const total = data.subtotal + data.tax + data.fee - data.discount;
    return total > 0;
  },
  {
    message: "Total transaksi (subtotal + pajak + biaya - diskon) harus > 0",
    path: ["discount"],
  }
);

export const updateExpenseSchema = expenseBaseSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "Minimal satu field harus diisi untuk update" }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;