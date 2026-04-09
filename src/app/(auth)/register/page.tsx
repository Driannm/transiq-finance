/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .min(2, "Nama minimal 2 karakter")
      .max(50, "Nama maksimal 50 karakter")
      .regex(/^[a-zA-Z\s'-]+$/, "Nama hanya boleh berisi huruf, spasi, atau tanda hubung"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid, contoh: nama@email.com")
      .max(100, "Email terlalu panjang"),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password terlalu panjang")
      .regex(/[A-Z]/, "Password harus mengandung setidaknya 1 huruf besar")
      .regex(/[0-9]/, "Password harus mengandung setidaknya 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const SERVER_ERROR_MESSAGES: Record<string, string> = {
  "Email already exists": "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun kamu.",
  "Missing fields": "Semua kolom wajib diisi.",
  "Internal server error": "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.",
};

function getServerErrorMessage(raw: string): string {
  return SERVER_ERROR_MESSAGES[raw] ?? "Terjadi kesalahan. Silakan coba lagi.";
}

/* ── Password strength ── */
const strengthChecks = [
  { label: "Min. 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "Huruf besar (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Angka (0-9)", test: (p: string) => /[0-9]/.test(p) },
];

const strengthColors = ["bg-red-500", "bg-amber-400", "bg-[#8ab820]"];
const strengthTextColors = ["text-red-600", "text-amber-600", "text-[#5a7a10]"];
const strengthLabels = ["Lemah", "Cukup", "Kuat"];

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const score = strengthChecks.filter((c) => c.test(password)).length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={[
              "h-[3px] flex-1 rounded-full transition-colors duration-300",
              i < score ? strengthColors[score - 1] : "bg-black/10",
            ].join(" ")}
          />
        ))}
        {score > 0 && (
          <span className={["text-[0.7rem] font-semibold uppercase tracking-wider ml-1", strengthTextColors[score - 1]].join(" ")}>
            {strengthLabels[score - 1]}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {strengthChecks.map((c) => {
          const pass = c.test(password);
          return (
            <span
              key={c.label}
              className={["flex items-center gap-1 text-[0.7rem] transition-colors duration-200", pass ? "text-[#4a6010]" : "text-black/30"].join(" ")}
            >
              <CheckCircle2 size={11} />
              {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Huge-Icons style SVG eyes ── */
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

/* ── Reusable field error ── */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-[0.75rem] text-red-700 pl-1">
      <AlertCircle size={11} className="shrink-0" />
      {message}
    </p>
  );
}

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
        setServerError(getServerErrorMessage(json.error ?? ""));
        return;
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      console.error(err);
      setServerError("Tidak dapat terhubung ke server. Periksa koneksi internet kamu.");
    }
  };

  const inputClass = (hasError: boolean) =>
    [
      "w-full bg-white rounded-2xl px-5 py-4 text-sm text-[#0f0f0f] placeholder:text-[#aaa]",
      "outline-none border-2 transition-all duration-150",
      hasError
        ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
        : "border-transparent focus:border-[#8ab820] focus:shadow-[0_0_0_3px_rgba(138,184,32,0.2)]",
    ].join(" ");

  return (
    <div className="relative min-h-svh bg-[#0f0f0f] flex items-center justify-center p-5 overflow-hidden">

      {/* ── Ghost background text ── */}
      <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
        {["create", "your", "account", "now"].map((word) => (
          <span
            key={word}
            className="text-[18vw] font-black text-[#1a1a1a] tracking-tighter lowercase leading-none"
          >
            {word}
          </span>
        ))}
      </div>

      {/* ── Page layout ── */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 py-6">

        {/* Branding */}
        <div className="flex flex-col gap-2 text-center md:text-left md:flex-1 md:max-w-sm">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
            join the<br />community!
          </h1>
          <p className="text-[#555] text-sm md:text-base leading-relaxed hidden md:block">
            Daftar sekarang dan mulai<br />dukung bisnis lokal favoritmu.
          </p>
        </div>

        {/* ── Register Card ── */}
        <div className="w-full max-w-[390px] bg-[#c8f135] rounded-3xl p-7 md:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col gap-5">

          {/* Card header */}
          <div>
            <p className="text-[#4a6010] text-[11px] font-semibold tracking-widest uppercase mb-1">register</p>
            <h2 className="text-[1.75rem] font-extrabold text-[#0f0f0f] tracking-tight leading-tight">
              buat akun baru
            </h2>
          </div>

          {/* Error banner */}
          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-600/30 bg-red-500/15 px-3.5 py-3 text-[0.8125rem] leading-snug text-red-800">
              <AlertCircle size={15} className="mt-px shrink-0" />
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <input
                id="name"
                type="text"
                placeholder="nama lengkap"
                autoComplete="name"
                autoFocus
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
                className={inputClass(!!errors.name)}
              />
              <FieldError id="name-error" message={errors.name?.message} />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <input
                id="email"
                type="email"
                placeholder="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className={inputClass(!!errors.email)}
              />
              <FieldError id="email-error" message={errors.email?.message} />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : "password-strength"}
                  {...register("password")}
                  className={inputClass(!!errors.password) + " pr-14"}
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
              <FieldError id="password-error" message={errors.password?.message} />
              <div id="password-strength">
                <PasswordStrengthBar password={passwordValue} />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="konfirmasi password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  {...register("confirmPassword")}
                  className={inputClass(!!errors.confirmPassword) + " pr-14"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              <FieldError id="confirm-error" message={errors.confirmPassword?.message} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full bg-[#8ab820] hover:bg-[#7aa515] text-white font-bold rounded-2xl py-4 text-sm flex items-center justify-center gap-2.5 transition-all duration-150 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(100,150,0,0.35)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Membuat akun...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                  Daftar
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div>
            <Link href="/login" className="flex items-center gap-2.5 group">
              <span className="w-6 h-6 rounded-full bg-[#0f0f0f] flex items-center justify-center text-[#c8f135] flex-shrink-0 group-hover:bg-[#2a2a2a] transition-colors">
                <ArrowIcon />
              </span>
              <span className="text-[0.8125rem] font-medium text-[#0f0f0f] group-hover:opacity-60 transition-opacity">
                sudah punya akun?{" "}
                <strong className="underline underline-offset-2">masuk di sini</strong>
              </span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}