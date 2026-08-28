// src/app/(app)/loans/[id]/edit/page.tsx
"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Calendar01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS, formatIDRInput } from "@/components/Loan/Format";
import { Hero } from "@/components/Loan/Hero";
import type { LoanCategory } from "@/components/Loan/types";
import { motion } from "framer-motion";

interface LoanData {
  id: string;
  name: string;
  debtor: string;
  category: LoanCategory;
  dueDate: string | null;
  totalAmount: number;
}

export default function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: loanId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [debtor, setDebtor] = useState("");
  const [category, setCategory] = useState<LoanCategory>("personal");
  const [dueDate, setDueDate] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountInputRef = useRef<HTMLInputElement>(null);
  const debtorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchLoan() {
      try {
        const res = await fetch(`/api/loans/${loanId}`);
        if (!res.ok) {
          router.push("/loans");
          return;
        }
        const data = await res.json();
        const loan: LoanData = {
          id: data.loan.id,
          name: data.loan.name,
          debtor: data.loan.debtor,
          category: data.loan.category || "personal",
          dueDate: data.loan.dueDate,
          totalAmount: data.loan.totalAmount,
        };
        setName(loan.name);
        setDebtor(loan.debtor);
        setCategory(loan.category);
        setDueDate(loan.dueDate ?? "");
        setAmountRaw(formatIDRInput(String(loan.totalAmount)));
      } catch {
        router.push("/loans");
      } finally {
        setLoading(false);
      }
    }
    fetchLoan();
  }, [loanId, router]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Catatan wajib diisi";
    if (!debtor.trim()) errs.debtor = "Nama peminjam wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          debtor: debtor.trim(),
          category,
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui piutang");
      toast.show({ title: "Piutang berhasil diperbarui", variant: "success" });
      router.push(`/loans/${loanId}`);
    } catch (err: unknown) {
      toast.show({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950 pb-24 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Edit Piutang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.back()}
          actions={[]}
        />
      </div>

      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col pt-[64px]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1" noValidate>
          <Hero
            amountRaw={amountRaw}
            onAmountChange={setAmountRaw}
            amountInputRef={amountInputRef}
            amountError={errors.amount}
            disabledAmount={true}
            loading={loading}
            debtor={debtor}
            onDebtorChange={setDebtor}
            debtorInputRef={debtorInputRef}
            debtorError={errors.debtor}
          />

          <div className="flex-1 px-4 space-y-6 pb-8">
            {/* CARD 2: Catatan & Jadwal */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)] px-1 mb-2">
                Catatan & Jadwal
              </p>
              <div className="rounded-2xl border border-[var(--line,#E7E4DD)] dark:border-neutral-800 overflow-hidden divide-y divide-[var(--line,#E7E4DD)] dark:divide-neutral-800 bg-white dark:bg-neutral-900/40">
                {/* Catatan Field */}
                <div className="px-4 py-3.5">
                  <p className="text-xs text-[var(--muted,#8A857D)] mb-1">Catatan</p>
                  {loading ? (
                    <Skeleton className="h-5 w-48 mt-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  ) : (
                    <input
                      id="edit-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Catatan, mis. Pinjaman modal usaha"
                      aria-label="Catatan piutang"
                      aria-invalid={!!errors.name}
                      className="w-full text-[15px] font-medium bg-transparent border-none outline-none placeholder:text-neutral-300 placeholder:font-normal dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white mt-0.5 animate-fade-in"
                    />
                  )}
                  {errors.name && (
                    <p role="alert" className="text-xs text-red-500 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Kategori Field */}
                <div className="py-3.5">
                  <p className="text-xs text-[var(--muted,#8A857D)] mb-2.5 px-4">Kategori</p>
                  <div
                    className={cn(
                      "flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-opacity duration-300",
                      loading && "pointer-events-none opacity-60"
                    )}
                    role="radiogroup"
                    aria-label="Kategori piutang"
                  >
                    {CATEGORY_OPTIONS.map((c) => {
                      const active = category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={loading}
                          onClick={() => setCategory(c.value)}
                          className={cn(
                            "flex-shrink-0 flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full text-sm font-medium border transition-colors",
                            active && !loading
                              ? "bg-[var(--accent-soft,#E7F1EC)] border-[var(--accent,#0E6E4E)]/30 text-[var(--accent,#0E6E4E)] dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                              : "bg-transparent text-neutral-500 dark:text-neutral-400 border-[var(--line,#E7E4DD)] dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700",
                          )}
                        >
                          {active && !loading ? (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                          ) : (
                            <HugeiconsIcon
                              icon={c.icon}
                              size={15}
                              className="text-neutral-400 dark:text-neutral-500"
                            />
                          )}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jatuh Tempo */}
                {loading ? (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      size={16}
                      className="flex-shrink-0 text-amber-500"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted,#8A857D)]">Tanggal Jatuh Tempo</p>
                      <Skeleton className="h-5 w-32 mt-1 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Tanggal Jatuh Tempo"
                        aria-invalid={!!errors.dueDate}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-neutral-900/50"
                      >
                        <HugeiconsIcon
                          icon={Calendar01Icon}
                          size={16}
                          className="flex-shrink-0 text-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--muted,#8A857D)]">Tanggal Jatuh Tempo</p>
                          <p
                            className={cn(
                              "text-[15px] font-medium mt-0.5 animate-fade-in",
                              dueDate
                                ? "text-neutral-900 dark:text-white"
                                : "text-neutral-400"
                            )}
                          >
                            {dueDate
                              ? format(new Date(dueDate), "d MMM yyyy", { locale: idLocale })
                              : "Pilih tanggal"}
                          </p>
                        </div>
                        {errors.dueDate && (
                          <p role="alert" className="text-xs text-red-500 flex-shrink-0">
                            {errors.dueDate}
                          </p>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xl rounded-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate ? new Date(dueDate) : undefined}
                        onSelect={(date) => setDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                        locale={idLocale}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          {/* BUTTON BAR - STICKY BOTTOM */}
          <div
            className="sticky bottom-0 left-0 right-0 px-4 pt-3 border-t border-[var(--line,#E7E4DD)] dark:border-neutral-800 bg-[var(--paper,#FAFAF8)]/85 dark:bg-neutral-950/85 backdrop-blur-md flex gap-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <motion.button
              type="button"
              onClick={() => router.back()}
              whileTap={{ scale: 0.98 }}
              className="flex-1 h-13 sm:h-14 rounded-2xl font-semibold text-[15px] border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              Batal
            </motion.button>
            <motion.button
              type="submit"
              disabled={saving}
              whileTap={saving ? undefined : { scale: 0.98 }}
              className={cn(
                "flex-1 h-13 sm:h-14 rounded-2xl font-semibold text-[15px] transition-colors flex items-center justify-center gap-2",
                !saving
                  ? "bg-[var(--accent,#0E6E4E)] hover:bg-emerald-800 text-white"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              )}
            >
              {saving && (
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                  aria-hidden
                />
              )}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
