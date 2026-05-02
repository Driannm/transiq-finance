// ─── next-auth.d.ts ───────────────────────────────────────────────────────────

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id:        string;
    role?:     string;
    familyId?: string;
  }

  interface Session {
    user: {
      id:        string;
      name?:     string | null;
      email?:    string | null;
      image?:    string | null;
      role?:     string;
      familyId?: string;
    };
    error?: "UserDeleted";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:           string;
    role?:        string;
    familyId?:    string;
    error?:       "UserDeleted";
    lastChecked?: number;   // Unix timestamp — untuk periodic DB re-validation
  }
}


// ─── auth-errors.ts ───────────────────────────────────────────────────────────
// Mapping error code → pesan user-friendly dalam Bahasa Indonesia.
// Import file ini di halaman login/register untuk menampilkan pesan yang benar.

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Error dari authorize() yang di-throw sebagai new Error("code")
  InvalidCredentials: "Email atau password yang Anda masukkan salah.",
  UserDeleted:        "Akun Anda telah dinonaktifkan. Hubungi administrator.",
  ValidationError:    "Format email atau password tidak valid.",
  ServerError:        "Terjadi kesalahan. Silakan coba beberapa saat lagi.",

  // Error bawaan NextAuth yang mungkin muncul
  CredentialsSignin:  "Email atau password yang Anda masukkan salah.",
  SessionRequired:    "Sesi Anda telah berakhir. Silakan login kembali.",
  session_expired:    "Sesi Anda telah berakhir. Silakan login kembali.",

  // Default fallback
  Default:            "Terjadi kesalahan yang tidak diketahui.",
};

export function getAuthErrorMessage(error?: string | null): string {
  if (!error) return "";
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

/**
 * Digunakan di halaman login untuk mengambil error dari URL search param.
 *
 * Contoh penggunaan:
 * ```tsx
 * const searchParams = useSearchParams();
 * const errorMsg = getAuthErrorMessage(searchParams.get("error"));
 * ```
 *
 * Contoh penggunaan dengan signIn():
 * ```tsx
 * const result = await signIn("credentials", {
 *   email, password,
 *   redirect: false,
 * });
 *
 * if (result?.error) {
 *   // result.error berisi error code yang di-throw di authorize()
 *   setError(getAuthErrorMessage(result.error));
 * }
 * ```
 */