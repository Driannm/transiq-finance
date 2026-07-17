import { z } from "zod";

export const createLoanSchema = z.object({
  cardId: z.string().min(1, "Kartu/rekening wajib dipilih"),
  name: z.string().min(1, "Nama piutang/deskripsi wajib diisi").max(255),
  debtor: z.string().min(1, "Penerima piutang/peminjam wajib diisi").max(255),
  totalAmount: z.number().positive("Total piutang harus lebih besar dari 0"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo pengembalian wajib diisi"),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateLoanSchema = createLoanSchema.partial();
