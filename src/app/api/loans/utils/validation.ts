import { z } from "zod";

const LOAN_CATEGORIES = ["personal", "family", "colleague", "other"] as const;

export const createLoanSchema = z.object({
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
  name: z.string().min(1, "Nama piutang/deskripsi wajib diisi").max(255),
  debtor: z.string().min(1, "Penerima piutang/peminjam wajib diisi").max(255),
  category: z.enum(LOAN_CATEGORIES).default("personal"),
  totalAmount: z.number().positive("Total piutang harus lebih besar dari 0"),
  loanDate: z.string().min(1, "Tanggal piutang diberikan wajib diisi"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo pengembalian wajib diisi"),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateLoanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  debtor: z.string().min(1).max(255).optional(),
  category: z.enum(LOAN_CATEGORIES).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  cardId: z.string().min(1, "Metode pembayaran/rekening wajib dipilih"),
  notes: z.string().max(255).optional().nullable(),
});
