import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Validation schema (shared, bisa di-import di frontend juga) ──────────────

export const loginSchema = z.object({
  email:    z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

// ─── Custom error codes ───────────────────────────────────────────────────────
// Jangan gunakan pesan generik "CredentialsSignin" — tidak informatif.
// Error codes ini di-map ke pesan user-friendly di halaman login.

export type AuthErrorCode =
  | "InvalidCredentials"   // Email atau password salah
  | "UserNotFound"         // Email tidak terdaftar  (opsional: sama dengan InvalidCredentials untuk keamanan)
  | "UserDeleted"          // Akun telah dihapus
  | "SessionExpired"       // Token sudah tidak valid
  | "ValidationError"      // Input tidak lolos schema
  | "ServerError";         // Error tak terduga

// ─── Auth options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Validasi input terlebih dahulu
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          // Throw dengan kode spesifik — ditangkap sebagai NEXT_AUTH_ERROR di client
          throw new Error("ValidationError");
        }

        const { email, password } = parsed.data;

        // 2. Ambil user dari DB
        // Selalu jalankan bcrypt.compare meski user tidak ada (timing-safe)
        // agar attacker tidak bisa bedakan "email tidak ada" vs "password salah"
        // berdasarkan response time.
        const user = await prisma.user.findUnique({
          where:  { email: email.toLowerCase().trim() },
          select: {
            id:        true,
            email:     true,
            name:      true,
            password:  true,
            role:      true,
            familyId:  true,
            deletedAt: true,   // Tambah soft-delete check
          },
        });

        // Dummy hash untuk timing-safe comparison saat user tidak ditemukan
        const DUMMY_HASH =
          "$2a$10$abcdefghijklmnopqrstuvuFakeHashForTimingSafetyPurpose";
        const passwordToCompare = user?.password ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(password, passwordToCompare);

        // 3. Evaluasi hasil — urutan penting: cek validity dulu, baru cek kondisi lain
        if (!user || !isValid) {
          // Pesan yang sama untuk keduanya — jangan bocorkan apakah email terdaftar
          throw new Error("InvalidCredentials");
        }

        if (user.deletedAt !== null) {
          throw new Error("UserDeleted");
        }

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name,
          role:     user.role,
          familyId: user.familyId ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    // jwt() dipanggil saat login awal dan setiap kali session di-access
    async jwt({ token, user, trigger }) {
      // Login awal: inject data user ke token
      if (user) {
        token.id       = user.id;
        token.role     = user.role;
        token.familyId = user.familyId;
      }

      // Periodic re-validation: setiap 15 menit, cek ke DB apakah user masih ada
      // Ini yang menangani kasus "user dihapus tapi session masih aktif"
      const REVALIDATE_INTERVAL = 15 * 60; // detik
      const shouldRevalidate =
        trigger !== "update" &&
        token.id &&
        (!token.lastChecked ||
          Math.floor(Date.now() / 1000) - (token.lastChecked as number) > REVALIDATE_INTERVAL);

      if (shouldRevalidate) {
        try {
          const dbUser = await prisma.user.findUnique({
            where:  { id: token.id as string },
            select: { id: true, role: true, familyId: true, deletedAt: true },
          });

          if (!dbUser || dbUser.deletedAt !== null) {
            // Tandai token sebagai invalid — middleware akan tangkap ini
            token.error = "UserDeleted";
          } else {
            // Sync perubahan role/familyId dari DB ke token
            token.role      = dbUser.role;
            token.familyId  = dbUser.familyId ?? undefined;
            token.lastChecked = Math.floor(Date.now() / 1000);
          }
        } catch {
          // Jangan invalidate session karena DB error sementara
          // Biarkan token lanjut dengan data lama
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id as string;
        session.user.role     = token.role as string;
        session.user.familyId = token.familyId as string | undefined;
      }

      // Propagate error ke session agar bisa di-handle di client
      if (token.error) {
        session.error = token.error as "UserDeleted";
      }

      return session;
    },
  },

  session: {
    strategy:   "jwt",
    maxAge:     7 * 24 * 60 * 60, // 7 hari
    updateAge:  24 * 60 * 60,     // Update cookie setiap 24 jam (bukan setiap request)
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error:  "/login",   // Redirect error ke login page, bukan /auth/error bawaan NextAuth
  },

  // Matikan debug di production untuk tidak bocorkan stack trace
  debug: process.env.NODE_ENV === "development",

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };