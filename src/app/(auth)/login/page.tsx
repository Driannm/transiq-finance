"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid, contoh: nama@email.com"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Error messages ───────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email atau password salah. Silakan coba lagi.",
  RateLimited:       "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  EmailNotVerified:  "Email kamu belum diverifikasi. Cek inbox untuk link aktivasi.",
  SessionRequired:   "Sesi kamu telah habis. Silakan login kembali.",
  UserDeleted:       "Akun kamu tidak ditemukan. Silakan hubungi admin.",
  Default:           "Terjadi kesalahan. Silakan coba beberapa saat lagi.",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
      <path d="M9.363 5.365A9.466 9.466 0 0 1 12 5c4.418 0 8 3.582 8 8a9.465 9.465 0 0 1-.535 2.637" />
      <path d="M14.636 18.635A9.466 9.466 0 0 1 12 19c-4.418 0-8-3.582-8-8 0-.88.136-1.73.386-2.527" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [serverError,    setServerError]    = useState<string | null>(null);
  const [showPassword,   setShowPassword]   = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") setJustRegistered(true);

    const errorParam = searchParams.get("error");
    if (errorParam) {
      setServerError(ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default);
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

    const result = await signIn("credentials", {
      redirect:  false,
      email:     data.email.toLowerCase().trim(),
      password:  data.password,
    });

    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const key = result?.error ?? "Default";
      setServerError(ERROR_MESSAGES[key] ?? ERROR_MESSAGES.Default);
    }
  };

  return (
    <div className="relative min-h-svh bg-[#0f0f0f] flex items-center justify-center p-5 overflow-hidden">
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">

        {/* Card */}
        <div className="w-full max-w-[390px] bg-[#c8f135] rounded-3xl p-7 md:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col gap-6">

          <div>
            <p className="text-[#4a6010] text-[11px] font-semibold tracking-widest uppercase mb-1">Login</p>
            <h2 className="text-[1.75rem] font-extrabold text-[#0f0f0f] tracking-tight leading-tight">
              Welcome Back
            </h2>
          </div>

          {justRegistered && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-green-700/30 bg-green-600/15 px-3.5 py-3 text-[0.8125rem] text-green-800">
              <CheckCircle2 size={15} className="shrink-0" />
              Akun berhasil dibuat! Silakan masuk.
            </div>
          )}

          {serverError && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-600/30 bg-red-500/15 px-3.5 py-3 text-[0.8125rem] text-red-800">
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <input
                id="email"
                type="email"
                placeholder="email"
                autoComplete="email"
                autoFocus
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className={[
                  "w-full bg-white rounded-2xl px-5 py-4 text-sm text-[#0f0f0f] placeholder:text-[#aaa]",
                  "outline-none border-2 transition-all duration-150",
                  errors.email
                    ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                    : "border-transparent focus:border-[#8ab820] focus:shadow-[0_0_0_3px_rgba(138,184,32,0.2)]",
                ].join(" ")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="flex items-center gap-1 text-[0.75rem] text-red-700 pl-1">
                  <AlertCircle size={11} className="shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                  className={[
                    "w-full bg-white rounded-2xl px-5 py-4 pr-14 text-sm text-[#0f0f0f] placeholder:text-[#aaa]",
                    "outline-none border-2 transition-all duration-150",
                    errors.password
                      ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                      : "border-transparent focus:border-[#8ab820] focus:shadow-[0_0_0_3px_rgba(138,184,32,0.2)]",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="flex items-center gap-1 text-[0.75rem] text-red-700 pl-1">
                  <AlertCircle size={11} className="shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full bg-[#8ab820] hover:bg-[#7aa515] text-white font-bold rounded-2xl py-4 text-sm flex items-center justify-center gap-2.5 transition-all duration-150 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(100,150,0,0.35)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                  Login
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="flex flex-col gap-2.5">
            <Link href="/forgot-password" className="flex items-center gap-2.5 group">
              <span className="w-6 h-6 rounded-full bg-[#0f0f0f] flex items-center justify-center text-[#c8f135] flex-shrink-0 group-hover:bg-[#2a2a2a] transition-colors">
                <ArrowIcon />
              </span>
              <span className="text-[0.8125rem] font-medium text-[#0f0f0f] group-hover:opacity-60 transition-opacity">
                Forgot Password?
              </span>
            </Link>

            <Link href="/register" className="flex items-center gap-2.5 group">
              <span className="w-6 h-6 rounded-full bg-[#0f0f0f] flex items-center justify-center text-[#c8f135] flex-shrink-0 group-hover:bg-[#2a2a2a] transition-colors">
                <ArrowIcon />
              </span>
              <span className="text-[0.8125rem] font-medium text-[#0f0f0f] group-hover:opacity-60 transition-opacity">
                Don&apos;t have an account?{" "}
                <strong className="underline underline-offset-2">Sign Up</strong>
              </span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}