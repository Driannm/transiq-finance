/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Shared/DebtPaymentForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

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
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [notes, setNotes] = useState("");

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
    if (!selectedCardId) {
      setError("Silakan pilih rekening pembayaran.");
      return;
    }
    if (amount <= 0) {
      setError("Nominal pembayaran wajib lebih besar dari Rp 0.");
      return;
    }
    if (amount > remainingAmount) {
      setError(`Pembayaran melebihi sisa utang (Maks. Rp ${new Intl.NumberFormat("id-ID").format(remainingAmount)}).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          cardId: selectedCardId,
          notes: notes.trim() || `Pembayaran cicilan: ${debtName}`,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/25 rounded-xl border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Info Tagihan Sisa */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tagihan Utang</p>
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">{debtName}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Sisa Kewajiban: <span className="font-mono font-bold text-rose-500">Rp {new Intl.NumberFormat("id-ID").format(remainingAmount)}</span>
        </p>
      </div>

      {/* Input Nominal */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nominal Pembayaran (IDR)</label>
        <div className="relative">
          <input
            type="number"
            className="w-full h-11 px-4 pr-24 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            placeholder="0"
            value={amount === 0 ? "" : amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={submitting}
            required
          />
          <button
            type="button"
            onClick={() => setAmount(remainingAmount)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-500 hover:text-rose-600 active:scale-95 transition-transform"
          >
            Lunas Penuh
          </button>
        </div>
      </div>

      {/* Dropdown Akun/Kartu pembayar */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Metode Pembayaran (Rekening/Dompet)</label>
        {loadingCards ? (
          <div className="h-11 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
        ) : (
          <select
            className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            disabled={submitting}
            required
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Saldo: Rp {new Intl.NumberFormat("id-ID").format(c.balance)})
              </option>
            ))}
            {cards.length === 0 && <option value="">Tidak ada rekening aktif</option>}
          </select>
        )}
      </div>

      {/* Catatan opsional */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Catatan Pembayaran (Opsional)</label>
        <input
          type="text"
          className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          placeholder="e.g. Pembayaran cicilan ke-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
        />
      </div>

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