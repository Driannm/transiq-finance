"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BadgeAlertIcon,
  CheckmarkBadge02Icon,
  Mail01Icon,
  User03Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

// ─── Schema Zod ─────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
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
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid")
      .max(100, "Email terlalu panjang"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password terlalu panjang")
      .regex(/[A-Z]/, "Harus mengandung setidaknya 1 huruf besar")
      .regex(/[0-9]/, "Harus mengandung setidaknya 1 angka"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Password Strength Checks ───────────────────────────────────────────────
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
    <div className="mt-2.5 px-4 space-y-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={[
              "h-[3px] flex-1 rounded-full transition-colors",
              i < score ? colors[score - 1] : "bg-gray-200",
            ].join(" ")}
          />
        ))}
        {score > 0 && (
          <span className={["text-[11px] font-semibold ml-1.5", labelColors[score - 1]].join(" ")}>
            {labels[score - 1]}
          </span>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
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

// ─── Page Component ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const passwordValue = watch("password");

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

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        setServerError("Response server tidak valid.");
        return;
      }

      if (!res.ok) {
        if (json && typeof json === "object" && "error" in json) {
          setServerError(String(json.error));
        } else {
          setServerError("Terjadi kesalahan. Silakan coba lagi.");
        }
        return;
      }

      if (json && typeof json === "object" && json.duplicated) {
        setServerError("Email sudah pernah digunakan.");
        return;
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Tidak dapat terhubung ke server.");
      }
    }
  };

  const getInputClass = (hasError: boolean) =>
    `w-full pl-12 pr-12 py-3.5 bg-white border rounded-full outline-none transition-all duration-200 text-sm ${
      hasError
        ? "border-red-500 bg-red-50/50 focus:border-red-500"
        : "border-[#E0E0E0] focus:border-[#1A1A1A]"
    }`;

  return (
    <div className="min-h-screen md:bg-gray-100 flex items-center justify-center font-sans text-[#1A1A1A] antialiased">
      <div className="w-full max-w-md min-h-screen md:min-h-0 bg-[#FAFAFA] md:rounded-[32px] md:shadow-lg md:border md:border-gray-200/50 flex flex-col justify-between px-6 py-8 relative overflow-hidden">
        
        {/* Peach Radial Gradient Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFEAD2]/40 via-white/0 to-transparent pointer-events-none rounded-full" />

        <div className="relative z-10 w-full">
          {/* Header */}
          <div className="text-center mt-6 mb-8">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Sign up</h1>
            <p className="text-sm text-[#757575] mt-2 max-w-[280px] mx-auto leading-relaxed">
              Hey, Enter your details to sign up your account
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 mb-5">
              <HugeiconsIcon icon={BadgeAlertIcon} size={14} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Name */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HugeiconsIcon icon={User03Icon} size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  {...register("name")}
                  className={getInputClass(!!errors.name)}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 px-4">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <HugeiconsIcon icon={Mail01Icon} size={18} />
                </span>
                <input
                  type="email"
                  placeholder="contoh@email.com"
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
              <PasswordStrength password={passwordValue ?? ""} />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 px-4">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Konfirmasi password"
                  {...register("confirmPassword")}
                  className={getInputClass(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HugeiconsIcon icon={showConfirm ? ViewIcon : ViewOffSlashIcon} size={18} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 px-4">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Legal Agreement */}
            <div className="px-2">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-gray-300 text-[#FFDE4D] focus:ring-[#FFDE4D] w-4 h-4 cursor-pointer mt-0.5"
                />
                <span className="text-[11px] text-[#757575] leading-normal">
                  I agree to the{" "}
                  <span className="text-[#1A1A1A] font-semibold hover:underline">Terms & Conditions</span>{" "}
                  and{" "}
                  <span className="text-[#1A1A1A] font-semibold hover:underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting || !agreeTerms}
              className="w-full bg-[#FFDE4D] text-[#1A1A1A] font-semibold py-3.5 rounded-full transition-all active:scale-[0.98] hover:bg-[#f5d03a] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              {isSubmitting ? "Membuat akun..." : "Create An Account"}
            </button>
          </form>

          {/* Social Auth Platform */}
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
        </div>

        {/* Footer Navigation */}
        <div className="relative z-10 text-center text-xs text-[#757575] mt-8">
          Already Have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-[#1A1A1A] font-semibold hover:underline"
          >
            Sign In
          </button>
        </div>

      </div>
    </div>
  );
}