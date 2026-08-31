/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Shared/DebtPaymentForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Card {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface DebtPaymentFormProps {
  debtId: string;
  debtName: string;
  remainingAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DebtPaymentForm({
  debtId,
  debtName,
  remainingAmount,
  onSuccess,
  onCancel,
}: DebtPaymentFormProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState<string>(
    new Intl.NumberFormat("id-ID").format(remainingAmount),
  );
  const [selectedCardId, setSelectedCardId] = useState("");
  const [notes, setNotes] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  // Ambil daftar rekening aktif
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch("/api/cards");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCards(data.cards || []);
        if (data.cards?.length > 0) {
          setSelectedCardId(data.cards[0].id);
        }
      } catch (err) {
        setError("Gagal memuat metode pembayaran.");
      } finally {
        setLoadingCards(false);
      }
    }
    fetchCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError(null);
    setCardError(null);
    setError(null);

    let hasError = false;

    if (!selectedCardId) {
      setCardError("Silakan pilih rekening pembayaran.");
      hasError = true;
    }

    const parsedAmount = parseFloat(amount.replace(/\./g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Nominal pembayaran wajib lebih besar dari Rp 0.");
      hasError = true;
    }
    if (parsedAmount > remainingAmount) {
      setAmountError(
        `Pembayaran melebihi sisa utang (Maks. Rp ${new Intl.NumberFormat("id-ID").format(remainingAmount)}).`,
      );
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(parsedAmount),
          cardId: selectedCardId,
          notes: notes.trim() || `Pembayaran cicilan: ${debtName}`,
        }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Gagal memproses pembayaran.");

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/25 rounded-xl border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Info Tagihan Sisa */}
      <div className="relative overflow-hidden bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col gap-3">
        {/* Left decorative line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 dark:bg-rose-500 rounded-l-2xl" />

        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-450 tracking-wider">
              Tagihan Utang
            </p>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate mt-0.5">
              {debtName}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-450 tracking-wider">
              Sisa Kewajiban
            </p>
            <p className="text-sm font-bold font-mono text-rose-500 dark:text-rose-400 mt-0.5">
              Rp {new Intl.NumberFormat("id-ID").format(remainingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Input Nominal */}
      <Field data-invalid={!!amountError}>
        <FieldLabel htmlFor="debt-payment-amount">
          Nominal Pembayaran <span className="text-destructive">*</span>
        </FieldLabel>
        <InputGroup className="h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500">
          <InputGroupAddon align="inline-start">
            <InputGroupText>IDR</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="debt-payment-amount"
            type="text"
            value={amount}
            onChange={(e) => {
              const cleanVal = e.target.value.replace(/\D/g, "");
              if (!cleanVal) {
                setAmount("");
                setAmountError("Nominal pembayaran wajib diisi.");
              } else {
                const parsed = parseInt(cleanVal, 10);
                setAmount(new Intl.NumberFormat("id-ID").format(parsed));
                if (parsed <= 0) {
                  setAmountError(
                    "Nominal pembayaran wajib lebih besar dari Rp 0.",
                  );
                } else if (parsed > remainingAmount) {
                  setAmountError(
                    `Pembayaran melebihi sisa utang (Maks. Rp ${new Intl.NumberFormat("id-ID").format(remainingAmount)}).`,
                  );
                } else {
                  setAmountError(null);
                }
              }
            }}
            disabled={submitting}
            required
            placeholder="0"
            className="h-11 text-sm font-semibold pl-1 font-mono tracking-tight"
          />
          <InputGroupAddon align="inline-end" className="pr-1.5">
            <button
              type="button"
              onClick={() => {
                setAmount(
                  new Intl.NumberFormat("id-ID").format(remainingAmount),
                );
                setAmountError(null);
              }}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 active:scale-95 transition-transform"
            >
              Lunas Penuh
            </button>
          </InputGroupAddon>
        </InputGroup>
        {amountError && <FieldError>{amountError}</FieldError>}
      </Field>

      {/* Dropdown Akun/Kartu pembayar */}
      <Field data-invalid={!!cardError}>
        <FieldLabel htmlFor="debt-payment-card-id">
          Metode Pembayaran <span className="text-destructive">*</span>
        </FieldLabel>
        {loadingCards ? (
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
        ) : (
          <select
            id="debt-payment-card-id"
            className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={selectedCardId}
            onChange={(e) => {
              setSelectedCardId(e.target.value);
              setCardError(null);
            }}
            disabled={submitting}
            required
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Saldo: Rp{" "}
                {new Intl.NumberFormat("id-ID").format(c.balance)})
              </option>
            ))}
            {cards.length === 0 && (
              <option value="">Tidak ada rekening aktif</option>
            )}
          </select>
        )}
        {cardError && <FieldError>{cardError}</FieldError>}
      </Field>

      {/* Catatan opsional */}
      <Field>
        <div className="flex items-center justify-between w-full">
          <FieldLabel htmlFor="debt-payment-notes">
            Catatan Pembayaran
          </FieldLabel>
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] py-0.5 px-1.5 h-auto"
          >
            Opsional
          </Badge>
        </div>
        <Textarea
          id="debt-payment-notes"
          className="w-full min-h-[85px] p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          placeholder="e.g. Pembayaran cicilan ke-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {/* Tombol Aksi */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          disabled={submitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 active:scale-95"
          disabled={submitting}
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              Konfirmasi Bayar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
