import { z } from "zod";

export const billBaseSchema = z.object({
  name: z.string().trim().min(1, "Nama tagihan wajib diisi").max(255),
  amount: z.number().nonnegative("Nominal tagihan tidak boleh negatif"),
  isFlexible: z.boolean().default(false),
  // date format: "YYYY-MM-DD" or standard date string (nullable for flexible bills)
  dueDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Format tanggal jatuh tempo tidak valid",
    }),
  category: z.string().optional().nullable(), // Allow generic strings
  categoryId: z.string().optional().nullable(),
  payee: z.string().trim().max(255).optional().nullable(),
  recurring: z.boolean().default(false),
  recurringInterval: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  cardId: z.string().min(1, "ID Kartu/Rekening tidak valid").optional().nullable(),
  createExpense: z.boolean().default(true),
});

export const createBillSchema = billBaseSchema;

export const updateBillSchema = z.object({
  name: z.string().trim().min(1, "Nama tagihan wajib diisi").max(255).optional(),
  amount: z.number().nonnegative("Nominal tagihan tidak boleh negatif").optional(),
  isFlexible: z.boolean().optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Format tanggal jatuh tempo tidak valid",
    }),
  category: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  payee: z.string().trim().max(255).optional().nullable(),
  recurring: z.boolean().optional(),
  recurringInterval: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  cardId: z.string().min(1, "ID Kartu/Rekening tidak valid").optional().nullable(),
  status: z.enum(["OPEN", "PAID", "OVERDUE", "paid", "pending", "overdue"]).optional(),
  createExpense: z.boolean().optional(),
  actualAmount: z.number().nonnegative().optional(),
  periodsPaid: z.number().int().min(1).optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
