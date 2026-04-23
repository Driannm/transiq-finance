import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Validation schema ────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .regex(/^[a-zA-Z\s'-]+$/, "Nama hanya boleh berisi huruf, spasi, atau tanda hubung"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(100, "Email terlalu panjang"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password terlalu panjang")
    .regex(/[A-Z]/, "Password harus mengandung setidaknya 1 huruf besar")
    .regex(/[0-9]/, "Password harus mengandung setidaknya 1 angka"),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Parse & validate ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName     = name.trim();

  try {
    // Hash password di luar transaksi (hindari timeout)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaksi: user → family → familyMember
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name:     trimmedName,
          email:    normalizedEmail,
          password: hashedPassword,
        },
      });

      const newFamily = await tx.family.create({
        data: {
          name: `Keluarga ${trimmedName}`,
          createdBy: newUser.id,
        },
      });

      await tx.familyMember.create({
        data: {
          userId:   newUser.id,
          familyId: newFamily.id,
          role:     "PARENT",
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { success: true, user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Cek unique constraint P2002 tanpa import khusus Prisma
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      // Jangan bocorkan bahwa email sudah terdaftar
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const message =
      error instanceof Error ? error.message : String(error);
    console.error("[register]", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}