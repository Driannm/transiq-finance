"use client";

import React, { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import {
  canSendTransfer,
  canReceiveTransfer,
  validateTransferTypes,
} from "@/lib/transferRules";
import {
  ArrowDown01Icon,
  ArrowLeft02Icon,
  ArrowDataTransferVerticalIcon,
  ArrowDataTransferDiagonalIcon,
  Calendar03Icon,
  Alert01Icon,
  CreditCardIcon,
  PurseIcon,
  WalletCardsIcon,
  Invoice02Icon,
} from "@hugeicons/core-free-icons";
import type { Card } from "./CardEditor";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

// Ambil angka saja dari input, buang nol di depan, batasi panjang
const toDigits = (raw: string) =>
  raw
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 13);

const showDigits = (digits: string) => (digits ? fmt(Number(digits)) : "");

// Tanggal lokal (YYYY-MM-DD). toISOString() memakai UTC sehingga di WIB
// sebelum jam 07.00 hasilnya masih tanggal kemarin.
const isoFromDate = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const dateLabel = (iso: string) => {
  if (!iso) return "Pilih tanggal";
  const now = new Date();
  if (iso === isoFromDate(now)) return "Hari ini";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (iso === isoFromDate(yesterday)) return "Kemarin";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const typeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "EWALLET":
      return PurseIcon;
    case "EMONEY":
      return WalletCardsIcon;
    case "PAYLATER":
      return Invoice02Icon;
    default:
      return CreditCardIcon;
  }
};

const balanceText = (c: Card) =>
  `${c.type === "PAYLATER" ? "Limit " : ""}IDR ${fmt(c.balance)}`;

// Pilihan biaya admin
const FEE_OPTIONS = [
  { value: 0, label: "Gratis" },
  { value: 2500, label: "IDR 2.500" },
  { value: 6500, label: "IDR 6.500" },
];

// ─── PILL KARTU ───────────────────────────────────────────────────────────────

function CardPill({
  card,
  onClick,
  reduce,
}: {
  card?: Card;
  onClick: () => void;
  reduce: boolean | null;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className="-ml-1 inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl py-1 pl-1 pr-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      {/* Ikon kartu */}
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
        <AnimatePresence initial={false}>
          <motion.span
            key={card?.id ?? "none"}
            initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: -40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 40 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 28 }
            }
            className="absolute inset-0 flex items-center justify-center"
          >
            <HugeiconsIcon
              icon={typeIcon(card?.type ?? "BANK")}
              size={15}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </motion.span>
        </AnimatePresence>
      </span>

      {/* Nama kartu */}
      <span className="relative h-[22px] min-w-0 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={card?.id ?? "none"}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
            className="block truncate text-[15px] font-medium leading-[22px] text-gray-600 dark:text-gray-300"
          >
            {card?.name ?? "Pilih kartu"}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

// ─── SHEET PEMILIH KARTU ──────────────────────────────────────────────────────

function CardPickerSheet({
  open,
  title,
  cards,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  cards: Card[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  // Esc untuk menutup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Kunci scroll halaman di belakang sheet
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflowY = prev.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] touch-none bg-black/40"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[61] mx-auto flex max-h-[75vh] max-w-md flex-col rounded-t-[28px] bg-white shadow-lg dark:bg-neutral-900"
          >
            <div className="shrink-0 border-b border-gray-200 px-5 pb-2 pt-3 dark:border-neutral-700">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                {title}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
              <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-neutral-700 dark:border-neutral-700">
                {cards.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelect(c.id);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active
                          ? "bg-emerald-50 dark:bg-emerald-950/30"
                          : "bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={typeIcon(c.type)}
                        size={16}
                        className={
                          active ? "text-emerald-500" : "text-gray-400"
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[14px] font-semibold ${
                            active
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {c.name}
                        </span>
                        {c.stakeholder && (
                          <span className="mt-0.5 block truncate text-[11px] text-gray-400 dark:text-gray-500">
                            a.n. {c.stakeholder}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-medium text-gray-500">
                        {balanceText(c)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── HALAMAN TRANSFER ─────────────────────────────────────────────────────────

interface TransferEditorProps {
  cards: Card[];
  initialFromId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function TransferEditor({
  cards,
  initialFromId,
  onSuccess,
}: TransferEditorProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const senderCards = cards.filter((c) => canSendTransfer(c.type));
  const receiverCards = cards.filter((c) => canReceiveTransfer(c.type));

  const [fromId, setFromId] = useState(
    () =>
      senderCards.find((c) => c.id === initialFromId)?.id ??
      senderCards[0]?.id ??
      "",
  );
  const [toId, setToId] = useState(() => {
    const from =
      senderCards.find((c) => c.id === initialFromId) ?? senderCards[0];
    return receiverCards.find((c) => c.id !== from?.id)?.id ?? "";
  });
  const [amount, setAmount] = useState(""); // digit saja
  const [fee, setFee] = useState(""); // "" = gratis, selain itu "2500" / "6500"
  const [date, setDate] = useState(() => isoFromDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [swapTurns, setSwapTurns] = useState(0);

  const fromCard = cards.find((c) => c.id === fromId);
  const toCard = cards.find((c) => c.id === toId);

  const amountNum = Number(amount || 0);
  const feeNum = Number(fee || 0);
  const total = amountNum + feeNum;

  // Paylater tidak bisa mengirim transfer, jadi semua pengirim memakai saldo
  const insufficient = !!fromCard && total > fromCard.balance;

  const typeError =
    fromCard && toCard
      ? validateTransferTypes(fromCard.type, toCard.type)
      : null;

  // Tukar hanya boleh kalau kartu tujuan juga boleh mengirim
  const canSwap = !!toCard && canSendTransfer(toCard.type);

  const canSubmit =
    !saving &&
    amountNum > 0 &&
    !!fromId &&
    !!toId &&
    fromId !== toId &&
    !insufficient &&
    !typeError;

  const swapCards = () => {
    setFromId(toId);
    setToId(fromId);
    setSwapTurns((t) => t + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId || !amountNum) {
      toast.error("Isi semua bidang utama transfer");
      return;
    }
    if (fromId === toId) {
      toast.error("Kartu asal dan tujuan tidak boleh sama");
      return;
    }
    if (typeError) {
      toast.error(typeError);
      return;
    }
    // Penjaga tambahan: form juga bisa terkirim lewat tombol Enter
    if (insufficient) {
      toast.error("Saldo tidak cukup untuk jumlah dan biaya admin");
      return;
    }

    const payload = {
      fromCardId: fromId,
      toCardId: toId,
      amount: amountNum,
      fee: feeNum,
      date,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/cards/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Transfer berhasil diproses");
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal memproses transfer");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  // Ukuran angka menyesuaikan panjang supaya tidak meluber
  const display = showDigits(amount);
  const amountSize =
    display.length <= 9
      ? "text-5xl"
      : display.length <= 13
        ? "text-4xl"
        : "text-3xl";

  const pickerCards =
    picker === "from"
      ? senderCards.filter((c) => c.id !== toId)
      : receiverCards.filter((c) => c.id !== fromId);

  return (
    <div className="min-h-screen bg-neutral-100 pb-28 font-sans dark:bg-neutral-950">
      <div className="fixed left-0 right-0 top-0 z-50">
        <IslandNavbar
          title="Transfers Baru"
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={() => router.back()}
          actions={[]}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-md space-y-4 px-4 pt-[84px]">
          {/* Dua baris + tombol tukar */}
          <div className="relative space-y-2">
            {/* DARI */}
            <section className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-900">
              <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <span>Dari</span>
                <span>{fromCard?.type === "PAYLATER" ? "Limit" : "Saldo"}</span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardPill
                    card={fromCard}
                    onClick={() => setPicker("from")}
                    reduce={reduce}
                  />
                </div>
                <span className="text-md shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">
                  IDR {fromCard ? fmt(fromCard.balance) : "0"}
                </span>
              </div>
            </section>

            {/* Tombol tukar */}
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <motion.button
                type="button"
                onClick={swapCards}
                disabled={!canSwap}
                aria-label="Tukar kartu asal dan tujuan"
                animate={{ rotate: reduce ? 0 : swapTurns * 180 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-neutral-100 bg-white text-neutral-500 shadow-sm dark:border-neutral-950 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <HugeiconsIcon icon={ArrowDataTransferVerticalIcon} size={14} />
              </motion.button>
            </div>

            {/* KE */}
            <section className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-900">
              <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <span>Ke</span>
                <span>Diterima</span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardPill
                    card={toCard}
                    onClick={() => setPicker("to")}
                    reduce={reduce}
                  />
                </div>
                <span
                  className={`text-md shrink-0 font-bold tabular-nums ${
                    amountNum
                      ? "text-gray-900 dark:text-white"
                      : "text-neutral-300 dark:text-neutral-700"
                  }`}
                >
                  IDR {fmt(amountNum)}
                </span>
              </div>
            </section>
          </div>

          {/* Angka besar: jumlah transfer + total */}
          <div className="flex flex-col items-center px-2 pb-1 pt-8">
            <div className="flex max-w-full items-baseline justify-center">
              <span className="text-2xl font-semibold text-neutral-400">
                IDR
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                aria-label="Jumlah transfer"
                value={display}
                onChange={(e) => setAmount(toDigits(e.target.value))}
                placeholder="0"
                style={{ width: `${Math.max(display.length, 1) + 0.6}ch` }}
                className={`min-w-[1ch] max-w-full bg-transparent text-center font-bold tabular-nums leading-none text-gray-900 placeholder:text-neutral-300 focus:outline-none dark:text-white dark:placeholder:text-neutral-700 ${amountSize}`}
              />
            </div>

            <p
              className={`mt-3 text-sm ${
                insufficient
                  ? "font-semibold text-red-500"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              Total keluar: IDR {fmt(total)}
            </p>

            {/* Tanggal + biaya admin: satu baris, keduanya bisa dipilih */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {/* Tanggal */}
              <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white pl-3.5 pr-3 text-xs font-bold text-gray-700 transition-all active:scale-95 dark:bg-neutral-900 dark:text-gray-200">
                <HugeiconsIcon icon={Calendar03Icon} size={15} />
                {dateLabel(date)}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  className="text-neutral-400"
                />
                <input
                  type="date"
                  required
                  value={date}
                  max={isoFromDate(new Date())}
                  onChange={(e) => setDate(e.target.value)}
                  // Di desktop, klik di mana saja langsung membuka kalender
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      /* browser tanpa showPicker: pakai perilaku bawaan */
                    }
                  }}
                  aria-label="Tanggal transfer"
                  className="absolute inset-0 h-full w-full cursor-pointer text-[16px] opacity-0"
                />
              </label>

              {/* Biaya admin */}
              <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white pl-3.5 pr-3 text-xs font-bold text-gray-700 transition-all active:scale-95 dark:bg-neutral-900 dark:text-gray-200">
                <span className="font-medium text-neutral-400">Admin</span>
                {FEE_OPTIONS.find((o) => o.value === feeNum)?.label ??
                  `IDR ${fmt(feeNum)}`}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  className="text-neutral-400"
                />
                <select
                  value={String(feeNum)}
                  onChange={(e) =>
                    setFee(e.target.value === "0" ? "" : e.target.value)
                  }
                  aria-label="Biaya admin"
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none text-[16px] opacity-0"
                >
                  {FEE_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Peringatan saldo */}
          <AnimatePresence initial={false}>
            {insufficient && (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-950/40 dark:bg-red-950/10">
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    size={15}
                    className="shrink-0 text-red-500"
                  />
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    Total (jumlah + biaya admin) melebihi saldo {fromCard?.name}
                    . Transfer tidak bisa diproses.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tombol kirim */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={15} />
            {saving
              ? "Memproses..."
              : insufficient
                ? "Saldo tidak cukup"
                : "Kirim Transfer Sekarang"}
          </button>
        </div>
      </form>

      <CardPickerSheet
        open={picker !== null}
        title={picker === "from" ? "Pilih Kartu Asal" : "Pilih Kartu Tujuan"}
        cards={pickerCards}
        selectedId={picker === "from" ? fromId : toId}
        onSelect={(id) => (picker === "from" ? setFromId(id) : setToId(id))}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
