// src/components/Loan/LoanPaymentForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatIDR, parseAmount } from "@/lib/format";

interface Card {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface PaymentFormProps {
  obligationId: string;
  obligationName: string;
  personName: string;
  remainingAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
  apiPath: string; // e.g. "/api/loans/ID/payments" or "/api/debts/ID/payments"
  titleLabel?: string; // e.g. "Piutang Aktif" or "Utang Aktif"
  personLabel?: string; // e.g. "Debitur:" or "Kreditur:"
}

export function PaymentForm({
  obligationId,
  obligationName,
  personName,
  remainingAmount,
  onSuccess,
  onCancel,
  apiPath,
  titleLabel = "Piutang Aktif",
  personLabel = "Debitur:",
}: PaymentFormProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState<string>(
    new Intl.NumberFormat("id-ID").format(Math.floor(remainingAmount))
  );
  const [selectedCardId, setSelectedCardId] = useState("");
  const [notes, setNotes] = useState("Pembayaran cicilan piutang");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  // Fetch active cards/rekening
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch("/api/cards");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = data.cards || [];
        setCards(list);
        if (list.length > 0) {
          setSelectedCardId(list[0].id);
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
      setCardError("Silakan pilih rekening penerima.");
      hasError = true;
    }

    const parsedAmount = parseFloat(amount.replace(/\./g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Nominal pembayaran wajib lebih besar dari Rp 0.");
      hasError = true;
    }
    if (parsedAmount > remainingAmount + 0.01) {
      setAmountError(
        `Pembayaran melebihi sisa piutang (Maks. Rp ${new Intl.NumberFormat(
          "id-ID"
        ).format(remainingAmount)}).`
      );
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(parsedAmount),
          cardId: selectedCardId,
          notes: notes.trim() || `Pembayaran cicilan: ${obligationName}`,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memproses pembayaran.");

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
        <div className="p-3 text-xs font-medium text-red-650 bg-red-50 dark:bg-red-950/25 rounded-xl border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Info Piutang Sisa */}
      <div className="relative overflow-hidden bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3">
        {/* Left decorative line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 dark:bg-emerald-500 rounded-l-2xl" />

        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              {titleLabel}
            </p>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate mt-0.5 animate-fade-in">
              {obligationName}
            </h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5">
              {personLabel}{" "}
              <span className="font-semibold text-gray-750 dark:text-gray-300">
                {personName}
              </span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Sisa Piutang
            </p>
            <p className="text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400 mt-0.5">
              Rp {new Intl.NumberFormat("id-ID").format(remainingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Dropdown Rekening Penerima */}
      <Field data-invalid={!!cardError}>
        <FieldLabel htmlFor="loan-payment-card-id">
          Rekening Penerima <span className="text-destructive">*</span>
        </FieldLabel>
        {loadingCards ? (
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
        ) : (
          <Select
            value={selectedCardId}
            onValueChange={(val) => {
              setSelectedCardId(val);
              setCardError(null);
            }}
          >
            <SelectTrigger
              id="loan-payment-card-id"
              className="w-full h-11 bg-neutral-100/50 dark:bg-neutral-950/40 rounded-xl px-3 border border-gray-150/70 dark:border-neutral-805 text-sm focus:ring-1 focus:ring-emerald-500"
            >
              <SelectValue placeholder="Pilih dompet/rekening" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-56 p-1 z-55">
              {cards.map((c) => (
                <SelectItem key={c.id} value={c.id} className="rounded-lg">
                  {c.name} (Saldo: Rp {formatIDR(c.balance)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {cardError && <FieldError>{cardError}</FieldError>}
      </Field>

      {/* Input Nominal */}
      <Field data-invalid={!!amountError}>
        <FieldLabel htmlFor="loan-payment-amount">
          Nominal Pembayaran <span className="text-destructive">*</span>
        </FieldLabel>
        <InputGroup className="h-11 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-gray-150/70 dark:border-neutral-805 focus-within:ring-1 focus-within:ring-emerald-500">
          <InputGroupAddon align="inline-start">
            <InputGroupText>IDR</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="loan-payment-amount"
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
                  setAmountError("Nominal pembayaran wajib lebih besar dari Rp 0.");
                } else if (parsed > remainingAmount) {
                  setAmountError(
                    `Nominal pembayaran tidak boleh melebihi sisa piutang (IDR ${formatIDR(
                      remainingAmount
                    )})`
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
                  new Intl.NumberFormat("id-ID").format(Math.floor(remainingAmount))
                );
                setAmountError(null);
              }}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 active:scale-95 transition-transform"
            >
              Lunas Penuh
            </button>
          </InputGroupAddon>
        </InputGroup>
        {amountError && <FieldError>{amountError}</FieldError>}
      </Field>

      {/* Catatan opsional */}
      <Field>
        <div className="flex items-center justify-between w-full">
          <FieldLabel htmlFor="loan-payment-notes">
            Keterangan / Notes
          </FieldLabel>
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] py-0.5 px-1.5 h-auto"
          >
            Opsional
          </Badge>
        </div>
        <Textarea
          id="loan-payment-notes"
          className="w-full min-h-[85px] rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-gray-150/70 dark:border-neutral-805 p-3 text-sm focus:ring-1 focus:ring-emerald-500"
          placeholder="Keterangan pembayaran"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {/* Tombol Aksi */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          disabled={submitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          disabled={submitting}
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              Simpan Pembayaran
            </>
          )}
        </button>
      </div>
    </form>
  );
}
