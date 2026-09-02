"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  GiftIcon,
  Building03Icon,
  LaptopIcon,
  BriefcaseDollarIcon,
  Briefcase01Icon,
  BadgeDollarSignIcon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";

import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
import { z } from "zod";
import { INCOME_SOURCE_CONFIG } from "@/lib/iconMapping";

import { Hero } from "@/components/DebtLoan/Hero";
import {
  CardSelector,
  type CardItem,
  type FetchState,
} from "@/components/Shared/CardSelector";
import { PillSelector } from "@/components/Shared/PillSelector";
import { DateRow } from "@/components/Shared/DateRow";
import { SubmitBar } from "@/components/DebtLoan/SubmitBar";
import { parseAmount } from "@/components/DebtLoan/Format";

const incomeSchema = z.object({
  name: z.string().min(1, "Nama pemasukan wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  amount: z.number().positive("Minimal Rp 1"),
});

export default function AddIncomePage() {
  const router = useRouter();
  const toast = useToast();

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLButtonElement>(null);

  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();
  const [cards, setCards] = useState<CardItem[]>([]);

  const [amountRaw, setAmountRaw] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const [sourceId, setSourceId] = useState("");
  const [cardId, setCardId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = parseAmount(amountRaw);

  const filteredCards = useMemo(
    () => cards.filter((c) => amount <= 0 || c.balance >= 0), // Removed strict balance filter for income, cards can receive income regardless of balance
    [cards, amount], // Actually we might not need any filter.
  );

  const sourcePillOptions = useMemo(
    () =>
      Object.entries(INCOME_SOURCE_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: config.icon,
      })),
    [],
  );

  const loadCards = useCallback(() => {
    setCardsState("loading");
    setCardsError(undefined);
    fetch("/api/cards")
      .then((r) => r.json())
      .then((cardData) => {
        const list = cardData.cards ?? [];
        setCards(list);
        if (list.length > 0) setCardId(list[0].id);
        setCardsState("success");
      })
      .catch((e) => {
        console.error(e);
        setCardsError("Gagal memuat kartu");
        setCardsState("error");
      });
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Sumber atau keperluan wajib diisi";
    if (!cardId) errs.cardId = "Pilih kartu tujuan";
    if (!amount || amount <= 0)
      errs.amount = "Nominal harus lebih besar dari 0";
    if (!date) errs.date = "Tanggal valid wajib diisi";

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.amount) amountInputRef.current?.focus();
      else if (errs.name) nameInputRef.current?.focus();
      else if (errs.date) dateInputRef.current?.focus();
    }
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          name: name.trim(),
          date,
          amount,
          source: sourceId || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pemasukan");

      toast.show({ title: "Pemasukan berhasil dicatat", variant: "success" });
      router.push("/incomes");
    } catch (err: unknown) {
      toast.show({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const ready = amount > 0 && name.trim().length > 0 && !!cardId;

  return (
    <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Tambah Pemasukan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.back()}
          actions={[]}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 pt-[64px]"
      >
        <Hero
          amountRaw={amountRaw}
          onAmountChange={setAmountRaw}
          amountInputRef={amountInputRef}
          amountError={errors.amount}
          personName={name}
          onPersonChange={setName}
          personInputRef={nameInputRef}
          personError={errors.name}
          personLabel="Sumber/Keperluan"
          personPlaceholder="Gaji, Jualan, Kado..."
        />

        <div className="flex-1 px-4 space-y-7 pb-8">
          <div>
            <CardSelector
              state={cardsState}
              cards={filteredCards}
              cardId={cardId}
              onSelect={setCardId}
              onRetry={loadCards}
              error={cardsError}
              label="Masuk Ke Rekening"
            />
            {errors.cardId && (
              <p role="alert" className="text-xs text-red-500 mt-2 px-1">
                {errors.cardId}
              </p>
            )}
          </div>

          <section>
            <div className="flex items-baseline justify-between px-1 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)]">
                Detail & Tanggal
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--line,#E7E4DD)] dark:border-neutral-800 overflow-hidden divide-y divide-[var(--line,#E7E4DD)] dark:divide-neutral-800 bg-white dark:bg-neutral-900/40">
              <div className="px-4 py-3.5">
                <p className="text-xs text-[var(--muted,#8A857D)] mb-1">
                  Catatan Opsional
                </p>
                <input
                  ref={notesInputRef}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  aria-label="Catatan opsional"
                  className="w-full text-[15px] font-medium bg-transparent border-none outline-none placeholder:text-neutral-300 placeholder:font-normal dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="py-2.5">
                <PillSelector
                  label="Asal Sumber"
                  options={sourcePillOptions}
                  value={sourceId}
                  onChange={setSourceId}
                  className="py-1"
                />
              </div>

              <div className="bg-white dark:bg-transparent">
                <DateRow
                  label="Tanggal Pemasukan"
                  value={date}
                  onChange={setDate}
                  triggerRef={dateInputRef}
                  error={errors.date}
                />
              </div>
            </div>
          </section>
        </div>

        <SubmitBar
          ready={ready}
          loading={submitting}
          label="Simpan Pemasukan"
        />
      </form>
    </div>
  );
}
