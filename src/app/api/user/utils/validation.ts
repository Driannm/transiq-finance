import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").max(255).optional(),
  email: z.string().email("Format email tidak valid").optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, "Password lama minimal 8 karakter"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});
