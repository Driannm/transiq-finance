// src/app/(app)/debts/add/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";

import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";

import { Hero } from "@/components/DebtLoan/Hero";
import { CardSelector } from "@/components/Shared/CardSelector";
import { ScheduleSection } from "@/components/DebtLoan/ScheduleSection";
import { SubmitBar } from "@/components/DebtLoan/SubmitBar";
import { parseAmount } from "@/components/DebtLoan/Format";
import type {
  CardItem,
  CardsFetchState,
  FormErrors,
  ObligationCategory,
} from "@/components/DebtLoan/types";

export default function AddDebtPage() {
  const router = useRouter();
  const toast = useToast();

  // Refs used both for direct focus (amount/creditor ghost inputs) and for
  // moving focus to the first invalid field after a failed validation.
  const amountInputRef = useRef<HTMLInputElement>(null);
  const creditorInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLButtonElement>(null);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<CardsFetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const [amountRaw, setAmountRaw] = useState("");
  const [creditor, setCreditor] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ObligationCategory>("personal");
  const [cardId, setCardId] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const amount = parseAmount(amountRaw);

  const filteredCards = useMemo(
    () => cards.filter((c) => amount <= 0 || c.balance >= amount),
    [cards, amount],
  );

  const loadCards = useCallback(() => {
    setCardsState("loading");
    setCardsError(undefined);
    fetch("/api/cards")
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat daftar rekening");
        return r.json();
      })
      .then((d) => {
        setCards(d.cards ?? []);
        setCardsState("success");
      })
      .catch(() => {
        setCardsState("error");
        setCardsError("Gagal memuat rekening. Periksa koneksi kamu.");
      });
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Keep the selected card valid as the balance filter changes (e.g. amount
  // grows past the current selection's balance). Auto-selecting the first
  // eligible account keeps the form fast to fill; if this ever feels opaque
  // to users, replace with an explicit "select an account" empty state instead.
  useEffect(() => {
    if (filteredCards.length > 0) {
      if (!cardId || !filteredCards.some((c) => c.id === cardId)) {
        setCardId(filteredCards[0].id);
      }
    } else {
      setCardId("");
    }
  }, [filteredCards, cardId]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!creditor.trim()) errs.personName = "Nama Pemberi Utang wajib diisi";
    if (!name.trim()) errs.name = "Deskripsi Utang wajib diisi";
    if (!cardId) errs.cardId = "Pilih rekening asal";
    if (!amount || amount <= 0)
      errs.amount = "Nominal harus lebih besar dari 0";
    if (!startDate) errs.startDate = "Tanggal utang wajib diisi";
    if (!dueDate) errs.dueDate = "Tanggal jatuh tempo wajib diisi";
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
    }
    return Object.keys(errs).length === 0;
  }

  function focusFirstError(errs: FormErrors) {
    if (errs.amount) return amountInputRef.current?.focus();
    if (errs.personName) return creditorInputRef.current?.focus();
    if (errs.name) return nameInputRef.current?.focus();
    if (errs.dueDate) return dueDateInputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          name: name.trim(),
          creditor: creditor.trim(),
          category,
          totalAmount: amount,
          date: startDate,
          dueDate,
          notes: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan Utang");
      toast.show({ title: "Utang berhasil ditambahkan", variant: "success" });
      router.push("/debts");
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

  const ready =
    amount > 0 && creditor.trim().length > 0 && name.trim().length > 0;

  return (
    <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Tambah Utang"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.back()}
          actions={[]}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 pt-[64px]">
        <Hero
          amountRaw={amountRaw}
          onAmountChange={setAmountRaw}
          amountInputRef={amountInputRef}
          amountError={errors.amount}
          personName={creditor}
          onPersonChange={setCreditor}
          personInputRef={creditorInputRef}
          personError={errors.personName}
          personLabel="Dari"
          personPlaceholder="Nama Kreditur"
        />

        <div className="flex-1 px-4 space-y-7 pb-8">
          <CardSelector
            state={cardsState}
            cards={filteredCards}
            amount={0}
            cardId={cardId}
            onSelect={setCardId}
            onRetry={loadCards}
            error={cardsError}
            label="Diterima Di"
          />
          {errors.cardId && (
            <p role="alert" className="text-xs text-red-500 -mt-5 px-1">
              {errors.cardId}
            </p>
          )}

          <ScheduleSection
            name={name}
            onNameChange={setName}
            nameError={errors.name}
            nameInputRef={nameInputRef}
            category={category}
            onCategoryChange={setCategory}
            startDate={startDate}
            onStartDateChange={setStartDate}
            startDateError={errors.startDate}
            // we can reuse amountInputRef as dummy or create new if we care about focus
            startDateInputRef={dueDateInputRef}
            startDateLabel="Tanggal Utang Dibuat"
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            dueDateError={errors.dueDate}
            dueDateInputRef={dueDateInputRef}
          />
        </div>

        <SubmitBar ready={ready} loading={submitting} />
      </form>
    </div>
  );
}
