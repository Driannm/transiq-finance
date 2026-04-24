"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BadgeAlertIcon,
  CheckmarkBadge02Icon,
  Mail01Icon,
  ReloadIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

// ─── Schema ───────────────────────────────────────────────────────────────────

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

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email atau password salah. Silakan coba lagi.",
  RateLimited: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  EmailNotVerified:
    "Email kamu belum diverifikasi. Cek inbox untuk link aktivasi.",
  SessionRequired: "Sesi kamu telah habis. Silakan login kembali.",
  UserDeleted: "Akun kamu tidak ditemukan. Silakan hubungi admin.",
  Default: "Terjadi kesalahan. Silakan coba beberapa saat lagi.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

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
  };

  return (
    <div className="min-h-svh bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-white rounded-[24px] overflow-hidden shadow-2xl flex min-h-[560px]">
        {/* ── Left panel: form ── */}
        <div className="flex-1 flex flex-col p-10 md:p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-gray-900 tracking-tight">
              FinKeluarga
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
              Welcome Back!
            </h1>
            <p className="text-sm text-gray-400">
              We Are Happy To See You Again
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={[
                "flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-150",
                activeTab === "signin"
                  ? "bg-[#4C8EF7] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              Sign In
            </button>
            <Link
              href="/register"
              onClick={() => setActiveTab("signup")}
              className={[
                "flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-150 text-center",
                activeTab === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              Sign Up
            </Link>
          </div>

          {/* Alerts */}
          {justRegistered && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-[13px] text-green-700 mb-5"
            >
              <HugeiconsIcon
                icon={CheckmarkBadge02Icon}
                size={14}
                className="shrink-0"
              />
              Akun berhasil dibuat! Silakan masuk.
            </div>
          )}
          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 mb-5"
            >
              <HugeiconsIcon
                icon={BadgeAlertIcon}
                size={14}
                className="shrink-0"
              />
              {serverError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-3"
          >
            {/* Email */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  {...register("email")}
                  className={[
                    "w-full bg-gray-50 rounded-xl px-4 py-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400",
                    "outline-none border transition-all duration-150",
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 focus:border-[#4C8EF7] focus:bg-white focus:ring-4 focus:ring-[#4C8EF7]/10",
                  ].join(" ")}
                />
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.email && (
                <p
                  role="alert"
                  className="text-[12px] text-red-500 pl-1 flex items-center gap-1"
                >
                  <HugeiconsIcon
                    icon={BadgeAlertIcon}
                    size={14}
                    className="shrink-0"
                  />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  className={[
                    "w-full bg-gray-50 rounded-xl px-4 py-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400",
                    "outline-none border transition-all duration-150",
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 focus:border-[#4C8EF7] focus:bg-white focus:ring-4 focus:ring-[#4C8EF7]/10",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <HugeiconsIcon icon={ViewIcon} size={16} />
                  ) : (
                    <HugeiconsIcon icon={ViewOffSlashIcon} size={16} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  role="alert"
                  className="text-[12px] text-red-500 pl-1 flex items-center gap-1"
                >
                  <HugeiconsIcon
                    icon={BadgeAlertIcon}
                    size={14}
                    className="shrink-0"
                  />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 rounded-full border-2 border-[#4C8EF7] flex items-center justify-center peer-checked:bg-[#4C8EF7] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
                <span className="text-[13px] text-gray-500">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] text-[#4C8EF7] hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-[#4C8EF7] hover:bg-[#3a7ef0] active:bg-[#2d6fe8] text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(76,142,247,0.35)]"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon
                    icon={ReloadIcon}
                    size={15}
                    className="animate-spin"
                  />{" "}
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>

        {/* ── Right panel: decorative ── */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-[#0a1628] items-end">
          {/* Animated fluid blobs */}
          <div className="absolute inset-0">
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#1a3a8f] opacity-60 blur-[60px]" />
            <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3060d0] opacity-40 blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-[#0a2070] opacity-70 blur-[50px]" />
            <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#5080ff] opacity-30 blur-[70px]" />
          </div>

          {/* Fluid SVG shapes */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 560"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="g1" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#4C8EF7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="g2" cx="30%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#1a5fff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="300" cy="150" rx="200" ry="180" fill="url(#g1)" />
            <ellipse cx="100" cy="400" rx="180" ry="160" fill="url(#g2)" />
            <path
              d="M 50 200 Q 200 100 350 250 Q 400 350 200 450 Q 50 500 0 350 Z"
              fill="#1e40af"
              fillOpacity="0.25"
            />
            <path
              d="M 150 50 Q 350 0 400 150 Q 420 300 280 350 Q 150 380 100 250 Z"
              fill="#3b82f6"
              fillOpacity="0.2"
            />
            <path
              d="M 0 300 Q 100 200 250 280 Q 380 350 350 480 Q 200 560 0 480 Z"
              fill="#1d4ed8"
              fillOpacity="0.3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
