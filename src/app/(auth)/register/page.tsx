
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

// ─── Schema ─────────────────────────────────────────────────────────────

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

// ─── Password strength ──────────────────────────────────────────────────

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
              "h-[3px] flex-1 rounded-full transition-colors",
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

// ─── Page ───────────────────────────────────────────────────────────────

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

      let json: unknown = null;

      try {
        json = await res.json();
      } catch {
        setServerError("Response server tidak valid.");
        return;
      }

      if (!res.ok) {
        if (
          typeof json === "object" &&
          json !== null &&
          "error" in json
        ) {
          setServerError(String((json as { error: string }).error));
        } else {
          setServerError("Terjadi kesalahan. Silakan coba lagi.");
        }
        return;
      }

      // handle duplicate stealth case (optional)
      if (
        typeof json === "object" &&
        json !== null &&
        "duplicated" in json &&
        (json as { duplicated: boolean }).duplicated
      ) {
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

  const inputClass = (hasError: boolean) =>
    [
      "w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400",
      "outline-none border transition-all",
      hasError
        ? "border-red-300 bg-red-50"
        : "border-gray-200 focus:border-[#4C8EF7] focus:bg-white focus:ring-4 focus:ring-[#4C8EF7]/10",
    ].join(" ");

  return (
    <div className="min-h-svh bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-white rounded-[24px] overflow-hidden shadow-2xl flex min-h-[560px]">
        <div className="flex-1 flex flex-col p-10 md:p-12 overflow-y-auto">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Buat Akun Baru
            </h1>
            <p className="text-sm text-gray-400">
              Daftar dan mulai kelola keuangan keluarga
            </p>
          </div>

          {serverError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600 mb-5">
              <HugeiconsIcon icon={BadgeAlertIcon} size={14} />
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            {/* Name */}
            <input
              placeholder="Nama lengkap"
              {...register("name")}
              className={inputClass(!!errors.name)}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className={inputClass(!!errors.email)}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}

            {/* Password */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              className={inputClass(!!errors.password)}
            />
            <PasswordStrength password={passwordValue ?? ""} />

            {/* Confirm */}
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Konfirmasi password"
              {...register("confirmPassword")}
              className={inputClass(!!errors.confirmPassword)}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 bg-blue-600 text-white py-3 rounded-xl"
            >
              {isSubmitting ? "Membuat akun..." : "Daftar"}
            </button>
          </form>

          <p className="text-sm mt-4 text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-blue-600">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}