import { z } from "zod";

export const billBaseSchema = z.object({
  name: z.string().trim().min(1, "Nama tagihan wajib diisi").max(255),
  amount: z.number().nonnegative("Nominal tagihan tidak boleh negatif"),
  // date format: "YYYY-MM-DD" or standard date string
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Format tanggal jatuh tempo tidak valid",
  }),
  category: z.enum([
    "utilities",
    "subscription",
    "rent",
    "insurance",
    "internet",
    "other"
  ]).optional().nullable(),
  payee: z.string().trim().max(255).optional().nullable(),
  recurring: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional().nullable(),
  cardId: z.string().cuid("ID Kartu/Rekening tidak valid").optional().nullable(),
});

export const createBillSchema = billBaseSchema;

export const updateBillSchema = z.object({
  name: z.string().trim().min(1, "Nama tagihan wajib diisi").max(255).optional(),
  amount: z.number().nonnegative("Nominal tagihan tidak boleh negatif").optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Format tanggal jatuh tempo tidak valid",
  }).optional(),
  category: z.enum([
    "utilities",
    "subscription",
    "rent",
    "insurance",
    "internet",
    "other"
  ]).optional().nullable(),
  payee: z.string().trim().max(255).optional().nullable(),
  recurring: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  cardId: z.string().cuid("ID Kartu/Rekening tidak valid").optional().nullable(),
  status: z.enum(["OPEN", "PAID", "OVERDUE", "paid", "pending", "overdue"]).optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
