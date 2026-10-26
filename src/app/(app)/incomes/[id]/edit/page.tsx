"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { format, isValid, parseISO } from "date-fns";

import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";
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

type IncomeDetail = {
  id: string;
  name: string;
  source: string | null;
  notes: string | null;
  transaction: {
    id: string;
    amount: number | string;
    date: string;
    card: {
      id: string;
      name: string;
      type: string;
    };
  };
};

export default function EditIncomePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const incomeId = params.id;

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLButtonElement>(null);

  const [income, setIncome] = useState<IncomeDetail | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<FetchState>("loading");
  const [cardsError, setCardsError] = useState<string>();

  const [amountRaw, setAmountRaw] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [cardId, setCardId] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  const amount = parseAmount(amountRaw);

  const sourcePillOptions = useMemo(
    () =>
      Object.entries(INCOME_SOURCE_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: config.icon,
      })),
    [],
  );

  const loadCards = useCallback(async () => {
    setCardsState("loading");
    setCardsError(undefined);

    try {
      const res = await fetch("/api/cards");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat kartu");
      }

      setCards(data.cards ?? []);
      setCardsState("success");
    } catch (error) {
      setCardsError(
        error instanceof Error ? error.message : "Gagal memuat kartu",
      );
      setCardsState("error");
    }
  }, []);

  const loadIncome = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await fetch(`/api/incomes/${encodeURIComponent(incomeId)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat pemasukan");
      }

      const item: IncomeDetail = data.income;

      if (!item?.transaction) {
        throw new Error("Data transaksi pemasukan tidak valid");
      }

      const parsedDate = parseISO(item.transaction.date);

      setIncome(item);
      setName(item.name);
      setNotes(item.notes ?? "");
      setSourceId(item.source ?? "");
      setAmountRaw(String(item.transaction.amount));
      setDate(isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : "");
      setCardId(item.transaction.card.id);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Gagal memuat pemasukan",
      );
    } finally {
      setLoading(false);
    }
  }, [incomeId]);

  useEffect(() => {
    void loadIncome();
    void loadCards();
  }, [loadIncome, loadCards]);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Sumber atau keperluan wajib diisi";
    }

    if (!cardId) {
      nextErrors.cardId = "Pilih rekening tujuan";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = "Nominal harus lebih besar dari 0";
    }

    if (!date || !isValid(parseISO(date))) {
      nextErrors.date = "Tanggal pemasukan tidak valid";
    }

    setErrors(nextErrors);

    if (nextErrors.amount) {
      amountInputRef.current?.focus();
    } else if (nextErrors.name) {
      nameInputRef.current?.focus();
    } else if (nextErrors.date) {
      dateInputRef.current?.focus();
    }

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate() || submitting) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/incomes/${encodeURIComponent(incomeId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount,
          date,
          cardId,
          source: sourceId || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui pemasukan");
      }

      toast.show({
        title: "Pemasukan berhasil diperbarui",
        variant: "success",
      });

      router.push("/incomes");
      router.refresh();
    } catch (error) {
      toast.show({
        title: "Gagal memperbarui pemasukan",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const ready =
    !!name.trim() &&
    !!cardId &&
    Number.isFinite(amount) &&
    amount > 0 &&
    !!date;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950">
        <div className="fixed inset-x-0 top-0 z-50">
          <IslandNavbar
            title="Edit Pemasukan"
            avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
            onAvatarPress={() => router.back()}
            actions={[]}
          />
        </div>
        <div className="px-4 pt-24">
          <div className="mx-auto max-w-lg animate-pulse space-y-4">
            <div className="h-40 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-32 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !income) {
    return (
      <div className="min-h-screen bg-[var(--paper,#FAFAF8)] px-4 pt-24 dark:bg-neutral-950">
        <div className="mx-auto max-w-lg space-y-4">
          <IslandNavbar
            title="Edit Pemasukan"
            avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
            onAvatarPress={() => router.back()}
            actions={[]}
          />
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900 dark:bg-neutral-900"
          >
            <p className="font-semibold text-neutral-900 dark:text-white">
              Pemasukan tidak dapat dimuat
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {loadError || "Data pemasukan tidak ditemukan."}
            </p>
            <button
              type="button"
              onClick={() => void loadIncome()}
              className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950">
      <div className="fixed left-0 right-0 top-0 z-50">
        <IslandNavbar
          title="Edit Pemasukan"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.back()}
          actions={[]}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col pt-[64px]"
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

        <div className="flex-1 space-y-7 px-4 pb-8">
          <div>
            <CardSelector
              state={cardsState}
              cards={cards}
              cardId={cardId}
              onSelect={setCardId}
              onRetry={() => void loadCards()}
              error={cardsError}
              label="Masuk Ke Rekening"
            />
            {errors.cardId && (
              <p role="alert" className="mt-2 px-1 text-xs text-red-500">
                {errors.cardId}
              </p>
            )}
          </div>

          <section>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)]">
                Detail &amp; Tanggal
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--line,#E7E4DD)] bg-white divide-y divide-[var(--line,#E7E4DD)] dark:border-neutral-800 dark:divide-neutral-800 dark:bg-neutral-900/40">
              <div className="px-4 py-3.5">
                <p className="mb-1 text-xs text-[var(--muted,#8A857D)]">
                  Catatan Opsional
                </p>
                <input
                  ref={notesInputRef}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  aria-label="Catatan opsional"
                  maxLength={1000}
                  className="w-full border-none bg-transparent text-[15px] font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-300 dark:text-white dark:placeholder:text-neutral-700"
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
          label="Simpan Perubahan"
        />
      </form>
    </div>
  );
}
