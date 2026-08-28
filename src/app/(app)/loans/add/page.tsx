// src/app/(app)/loans/add/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";

import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { useToast } from "@/hooks/UseToast";

import { Hero } from "@/components/Loan/Hero";
import { SourceAccountSelector } from "@/components/Loan/SourceAccount";
import { ScheduleSection } from "@/components/Loan/ScheduleSection";
import { SubmitBar } from "@/components/Loan/SubmitBar";
import { parseAmount } from "@/components/Loan/Format";
import type {
  CardItem,
  CardsFetchState,
  FormErrors,
  LoanCategory,
} from "@/components/Loan/types";

export default function AddLoanPage() {
  const router = useRouter();
  const toast = useToast();

  // Refs used both for direct focus (amount/debtor ghost inputs) and for
  // moving focus to the first invalid field after a failed validation.
  const amountInputRef = useRef<HTMLInputElement>(null);
  const debtorInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const loanDateInputRef = useRef<HTMLButtonElement>(null);
  const dueDateInputRef = useRef<HTMLButtonElement>(null);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardsState, setCardsState] = useState<CardsFetchState>("loading");
  const [cardsError, setCardsError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [amountRaw, setAmountRaw] = useState("");
  const [debtor, setDebtor] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LoanCategory>("personal");
  const [cardId, setCardId] = useState("");
  const [loanDate, setLoanDate] = useState(format(new Date(), "yyyy-MM-dd"));
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
    if (!debtor.trim()) errs.debtor = "Nama peminjam wajib diisi";
    if (!name.trim()) errs.name = "Deskripsi piutang wajib diisi";
    if (!cardId) errs.cardId = "Pilih rekening asal";
    if (!amount || amount <= 0)
      errs.amount = "Nominal harus lebih besar dari 0";
    if (!loanDate) errs.loanDate = "Tanggal pemberian wajib diisi";
    if (!dueDate) errs.dueDate = "Tanggal jatuh tempo wajib diisi";
    if (dueDate && loanDate && dueDate < loanDate)
      errs.dueDate = "Jatuh tempo harus setelah tanggal pemberian";
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
    }
    return Object.keys(errs).length === 0;
  }

  function focusFirstError(errs: FormErrors) {
    // Move focus to the first invalid field so keyboard and screen-reader
    // users land somewhere meaningful instead of just seeing inline text.
    if (errs.amount) return amountInputRef.current?.focus();
    if (errs.debtor) return debtorInputRef.current?.focus();
    if (errs.name) return nameInputRef.current?.focus();
    if (errs.loanDate) return loanDateInputRef.current?.focus();
    if (errs.dueDate) return dueDateInputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          name: name.trim(),
          debtor: debtor.trim(),
          category,
          totalAmount: amount,
          loanDate,
          dueDate,
          notes: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan piutang");
      toast.show({ title: "Piutang berhasil ditambahkan", variant: "success" });
      router.push("/loans");
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
    amount > 0 && debtor.trim().length > 0 && name.trim().length > 0;

  return (
    <div className="min-h-screen bg-[var(--paper,#FAFAF8)] dark:bg-neutral-950 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Tambah Piutang"
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
          debtor={debtor}
          onDebtorChange={setDebtor}
          debtorInputRef={debtorInputRef}
          debtorError={errors.debtor}
        />

        <div className="flex-1 px-4 space-y-7 pb-8">
          <SourceAccountSelector
            state={cardsState}
            cards={filteredCards}
            amount={amount}
            cardId={cardId}
            onSelect={setCardId}
            onRetry={loadCards}
            error={cardsError}
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
            loanDate={loanDate}
            onLoanDateChange={setLoanDate}
            loanDateError={errors.loanDate}
            loanDateInputRef={loanDateInputRef}
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
