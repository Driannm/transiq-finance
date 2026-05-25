"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BadgeAlertIcon,
  CheckmarkBadge02Icon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

// ─── Schema Zod ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Kamus error yang ramah pengguna
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email atau password salah. Silakan coba lagi.",
  RateLimited: "Terlalu banyak percobaan akses. Coba lagi dalam beberapa menit.",
  EmailNotVerified: "Email kamu belum diverifikasi. Cek inbox untuk link aktivasi.",
  SessionRequired: "Sesi Anda telah habis. Silakan login kembali.",
  UserDeleted: "Akun tidak ditemukan. Silakan hubungi administrator.",
  Default: "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.",
};

// ─── Form Login Component (Suspense Wrapper) ──────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    // Deteksi jika baru selesai mendaftar
    if (searchParams.get("registered") === "true") setJustRegistered(true);

    // Pembacaan Parameter Error Secara Dinamis
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const mappedMessage = ERROR_MESSAGES[errorParam];
      if (mappedMessage) {
        // Jika kode error terdaftar di kamus
        setServerError(mappedMessage);
      } else if (errorParam.length > 3) {
        // Jika parameter berupa teks custom (misal dari backend lain), tampilkan langsung secara aman
        setServerError(decodeURIComponent(errorParam));
      } else {
        setServerError(ERROR_MESSAGES.Default);
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setJustRegistered(false);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const key = result?.error ?? "Default";
        setServerError(ERROR_MESSAGES[key] ?? ERROR_MESSAGES.Default);
      }
    } catch (err) {
      setServerError("Gagal terhubung dengan server.");
    }
  };

  const getInputClass = (hasError: boolean) =>
    `w-full pl-12 pr-12 py-3.5 bg-white border rounded-full outline-none transition-all duration-200 text-sm ${
      hasError
        ? "border-red-500 bg-red-50/50 focus:border-red-500"
        : "border-[#E0E0E0] focus:border-[#1A1A1A]"
    }`;

  return (
    <div className="relative z-10 w-full">
      {/* Header */}
      <div className="text-center mt-6 mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Login</h1>
        <p className="text-sm text-[#757575] mt-2 max-w-[280px] mx-auto leading-relaxed">
          Hey, Enter your details to get log in to your account
        </p>
      </div>

      {/* Alert Pendaftaran Berhasil */}
      {justRegistered && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700 mb-5">
          <HugeiconsIcon icon={CheckmarkBadge02Icon} size={14} className="shrink-0" />
          <span>Akun berhasil dibuat! Silakan masuk.</span>
        </div>
      )}

      {/* Alert Error Dinamis & Responsif */}
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 mb-5">
          <HugeiconsIcon icon={BadgeAlertIcon} size={14} className="shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <HugeiconsIcon icon={Mail01Icon} size={18} />
            </span>
            <input
              type="email"
              placeholder="contoh@email.com"
              autoComplete="email"
              {...register("email")}
              className={getInputClass(!!errors.email)}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 px-4">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              className={getInputClass(!!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HugeiconsIcon icon={showPassword ? ViewIcon : ViewOffSlashIcon} size={18} />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1 px-4">{errors.password.message}</p>
          )}
        </div>

        {/* Utilities */}
        <div className="flex justify-between items-center text-xs px-2">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-[#FFDE4D] focus:ring-[#FFDE4D] w-4 h-4 cursor-pointer"
            />
            <span className="text-[#1A1A1A]">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-[#757575] hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* CTA Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#FFDE4D] text-[#1A1A1A] font-semibold py-3.5 rounded-full transition-all active:scale-[0.98] hover:bg-[#f5d03a] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      {/* Social Separator */}
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-xs text-[#757575]">Or continue with</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <div className="flex justify-center space-x-4">
        {/* Google */}
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
        </button>
        {/* Apple */}
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
          </svg>
        </button>
        {/* Facebook */}
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-[#757575] mt-8">
        Don&apos;t Have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="text-[#1A1A1A] font-semibold hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen md:bg-gray-100 flex items-center justify-center font-sans text-[#1A1A1A] antialiased">
      <div className="w-full max-w-md min-h-screen md:min-h-0 bg-[#FAFAFA] md:rounded-[32px] md:shadow-lg md:border md:border-gray-200/50 flex flex-col justify-between px-6 py-8 relative overflow-hidden">
        
        {/* Peach Radial Gradient Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFEAD2]/40 via-white/0 to-transparent pointer-events-none rounded-full" />

        <Suspense fallback={<div className="text-center py-8 text-sm text-[#757575]">Loading...</div>}>
          <LoginForm />
        </Suspense>

      </div>
    </div>
  );
}