/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BadgeAlertIcon,
  CheckmarkBadge02Icon,
  Mail01Icon,
  ReloadIcon,
  User03Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .min(2, "Nama minimal 2 karakter")
      .max(50, "Nama maksimal 50 karakter")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Nama hanya boleh berisi huruf, spasi, atau tanda hubung"
      ),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid")
      .max(100, "Email terlalu panjang"),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password terlalu panjang")
      .regex(/[A-Z]/, "Harus mengandung setidaknya 1 huruf besar")
      .regex(/[0-9]/, "Harus mengandung setidaknya 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Password strength ────────────────────────────────────────────────────────

const strengthChecks = [
  { label: "Min. 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Huruf besar", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Angka", test: (p: string) => /[0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = strengthChecks.filter((c) => c.test(password)).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-green-500"];
  const labels = ["Lemah", "Cukup", "Kuat"];
  const labelColors = ["text-red-500", "text-amber-500", "text-green-600"];

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={[
              "h-[3px] flex-1 rounded-full transition-colors duration-300",
              i < score ? colors[score - 1] : "bg-gray-200",
            ].join(" ")}
          />
        ))}
        {score > 0 && (
          <span
            className={[
              "text-[11px] font-semibold ml-1.5",
              labelColors[score - 1],
            ].join(" ")}
          >
            {labels[score - 1]}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        {strengthChecks.map((c) => (
          <span
            key={c.label}
            className={[
              "flex items-center gap-1 text-[11px]",
              c.test(password) ? "text-green-600" : "text-gray-400",
            ].join(" ")}
          >
            <HugeiconsIcon icon={CheckmarkBadge02Icon} size={10} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      console.error(err);
      setServerError("Tidak dapat terhubung ke server. Periksa koneksi kamu.");
    }
  };

  const inputClass = (hasError: boolean) =>
    [
      "w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400",
      "outline-none border transition-all duration-150",
      hasError
        ? "border-red-300 bg-red-50"
        : "border-gray-200 focus:border-[#4C8EF7] focus:bg-white focus:ring-4 focus:ring-[#4C8EF7]/10",
    ].join(" ");

  return (
    <div className="min-h-svh bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-white rounded-[24px] overflow-hidden shadow-2xl flex min-h-[560px]">
        {/* ── Left panel: form ── */}
        <div className="flex-1 flex flex-col p-10 md:p-12 overflow-y-auto">
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
              Buat Akun Baru
            </h1>
            <p className="text-sm text-gray-400">
              Daftar dan mulai kelola keuangan keluarga
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7 w-full">
            <Link
              href="/login"
              className="flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-150 text-center text-gray-500 hover:text-gray-700"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="flex-1 text-sm font-medium py-2 rounded-lg bg-white text-gray-900 shadow-sm transition-all duration-150"
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 mb-5"
            >
              <HugeiconsIcon
                icon={BadgeAlertIcon}
                size={14}
                className="shrink-0 mt-px"
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
            {/* Name */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={!!errors.name}
                  {...register("name")}
                  className={inputClass(!!errors.name) + " pr-11"}
                />
                <HugeiconsIcon
                  icon={User03Icon}
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.name && (
                <p
                  role="alert"
                  className="text-[12px] text-red-500 pl-1 flex items-center gap-1"
                >
                  <HugeiconsIcon
                    icon={BadgeAlertIcon}
                    size={14}
                    className="shrink-0"
                  />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Alamat email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                  className={inputClass(!!errors.email) + " pr-11"}
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
                  placeholder="Password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  className={inputClass(!!errors.password) + " pr-11"}
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
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Konfirmasi password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                  className={inputClass(!!errors.confirmPassword) + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? (
                    <HugeiconsIcon icon={ViewIcon} size={16} />
                  ) : (
                    <HugeiconsIcon icon={ViewOffSlashIcon} size={16} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  role="alert"
                  className="text-[12px] text-red-500 pl-1 flex items-center gap-1"
                >
                  <HugeiconsIcon
                    icon={BadgeAlertIcon}
                    size={14}
                    className="shrink-0"
                  />
                  {errors.confirmPassword.message}
                </p>
              )}
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
                  />
                  Membuat akun...
                </>
              ) : (
                "Daftar"
              )}
            </button>
          </form>
        </div>

        {/* ── Right panel: decorative ── */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-[#0a1628] items-end">
          <div className="absolute inset-0">
            <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#1a3a8f] opacity-60 blur-[60px]" />
            <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#3060d0] opacity-40 blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-[#0a2070] opacity-70 blur-[50px]" />
            <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#5080ff] opacity-30 blur-[70px]" />
          </div>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 560"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="rg1" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#4C8EF7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="rg2" cx="30%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#1a5fff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0a1628" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="300" cy="150" rx="200" ry="180" fill="url(#rg1)" />
            <ellipse cx="100" cy="400" rx="180" ry="160" fill="url(#rg2)" />
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
