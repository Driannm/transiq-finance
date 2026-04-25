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
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Nama hanya boleh berisi huruf, spasi, atau tanda hubung"
    ),
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
    return NextResponse.json(
      { error: "Request body tidak valid" },
      { status: 400 }
    );
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
  const trimmedName = name.trim();

  try {
    // Hash password terlebih dahulu (di luar transaksi)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Buat user baru
    let newUser;
    try {
      newUser = await prisma.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });
    } catch (error: unknown) {
      // Cek duplicate email (P2002)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        // Jangan bocorkan informasi ke klien
        return NextResponse.json({ success: true }, { status: 200 });
      }
      throw error; // lempar ke outer catch
    }

    // 2. Buat family + family membership
    try {
      const family = await prisma.family.create({
        data: {
          name: `Keluarga ${trimmedName}`,
        },
      });

      await prisma.familyMember.create({
        data: {
          userId: newUser.id,
          familyId: family.id,
          role: "PARENT",
          isOwner: true,
        },
      });
    } catch (error) {
      // Jika gagal, hapus user yang sudah dibuat (rollback manual)
      await prisma.user.delete({ where: { id: newUser.id } });
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error("[register]", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}