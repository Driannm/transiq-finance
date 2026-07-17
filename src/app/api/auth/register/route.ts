import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRegisterRateLimit } from "@/lib/rate-limiting";

// ─── Validation schema ────────────────────────────────────────────────────────
// Export agar bisa di-reuse di form frontend (zodResolver)

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Nama hanya boleh berisi huruf, spasi, apostrof, atau tanda hubung",
    ),

  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang"),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter") // batas bcrypt
    .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Helper response ──────────────────────────────────────────────────────────

function errorResponse(
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return NextResponse.json(
    { success: false, error: message, ...(details && { details }) },
    { status },
  );
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── 1. Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rateLimitResult = checkRegisterRateLimit(ip);

  if (!rateLimitResult.success) {
    return errorResponse(
      "Terlalu banyak percobaan registrasi. Coba lagi dalam 1 jam.",
      429,
    );
  }

  // ── 2. Parse & validasi body ────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Format request tidak valid.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    // Kirim field-level errors agar form bisa highlight field yang salah
    const details = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    return errorResponse("Data yang dimasukkan tidak valid.", 422, details);
  }

  const { name, email, password } = parsed.data;

  // ── 3. Hash password ────────────────────────────────────────────────────────
  // Round 10 = ~100ms, cukup aman untuk registrasi (round 12 = ~400ms, terlalu lambat untuk UX)
  const hashedPassword = await bcrypt.hash(password, 10);

  // ── 4. Simpan ke DB ─────────────────────────────────────────────────────────
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "PARENT",
        family: {
          create: { name: `Keluarga ${name}` },
        },
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    // Email duplikat
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "Email sudah terdaftar. Silakan login atau gunakan email lain.",
        409,
      );
    }

    // DB tidak tersedia atau timeout
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("[register] DB connection error:", error.message);
      return errorResponse(
        "Layanan sedang tidak tersedia. Coba beberapa saat lagi.",
        503,
      );
    }

    console.error("[register] Unexpected error:", error);
    return errorResponse("Terjadi kesalahan. Silakan coba lagi.", 500);
  }
}
