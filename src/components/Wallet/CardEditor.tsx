"use client";

import React, { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import {
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  CreditCard,
  type CardLogo,
  type CreditCardType,
} from "@/components/ui/credit-card/credit-card";
import {
  CARD_TYPE_CONFIG,
  CARD_TYPE_ORDER,
  NETWORK_OPTIONS,
  SWIPE_DISTANCE,
  SWIPE_VELOCITY,
  cardSlideVariants,
  getStyleIndex,
  type CardType,
} from "./CardStyles";

export type { CardType };

export interface Card {
  id: string;
  name: string;
  stakeholder?: string | null;
  type: CardType;
  balance: number;
  cutoffDay?: number | null;
  dueDay?: number | null;
  dueOffset?: number | null;
  style?: CreditCardType | null;
  logo?: CardLogo | null;
}

const STEPS = [
  { label: "Jenis", title: "Pilih jenis kartu" },
  { label: "Tampilan", title: "Atur tampilan kartu" },
  { label: "Detail", title: "Isi detail kartu" },
];
const LAST_STEP = STEPS.length - 1;

// ─── KOMPONEN KECIL (gaya sama dengan halaman Transfer) ───────────────────────

// Grup baris ala iOS: judul kecil di luar, isi putih tanpa border,
// antar-baris dipisah garis tipis
function Group({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {title && (
        <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {title}
        </p>
      )}
      <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl bg-white dark:divide-neutral-800 dark:bg-neutral-900">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}

// 16px: di bawah itu Safari iOS otomatis zoom saat kolom difokus
const rowInputCls =
  "min-w-0 flex-1 bg-transparent text-right text-[16px] font-semibold text-neutral-900 placeholder:text-neutral-300 focus:outline-none dark:text-white dark:placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────

interface CardEditorProps {
  card: Card | null; // null = kartu baru
  onBack: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function CardEditor({ card, onSaved, onDeleted }: CardEditorProps) {
  const isEdit = !!card;
  const initialType: CardType = card?.type ?? "BANK";
  const router = useRouter();

  // Step hanya dipakai saat menambah kartu baru
  const [step, setStep] = useState(0);

  const [name, setName] = useState(card?.name ?? "");
  const [type, setType] = useState<CardType>(initialType);
  const [balance, setBalance] = useState(card ? String(card.balance) : "");

  // Warna dipilih lewat slide; index mengacu ke daftar warna milik jenis kartu
  const [styleIndex, setStyleIndex] = useState(() =>
    getStyleIndex(initialType, card?.style),
  );
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right",
  );
  const isDraggingRef = useRef(false);

  // Jaringan pembayaran (hanya relevan untuk Debit/Bank)
  const [logo, setLogo] = useState<CardLogo>(
    card?.type === "BANK" ? (card.logo ?? "mastercard") : "mastercard",
  );

  // Paylater
  const [cutoff, setCutoff] = useState(String(card?.cutoffDay || 20));
  const [dueDay, setDueDay] = useState(String(card?.dueDay || 5));
  const [dueOffset, setDueOffset] = useState(String(card?.dueOffset || 1));

  const [saving, setSaving] = useState(false);

  const config = CARD_TYPE_CONFIG[type];
  const options = config.options;
  const safeIndex = Math.min(styleIndex, options.length - 1);
  const currentStyle = options[safeIndex];
  const previewLogo: CardLogo = config.supportsNetwork ? logo : "none";

  // Edit: semua bagian tampil sekaligus. Tambah: satu langkah per layar.
  const showStep = (i: number) => isEdit || step === i;
  const canSwipe = showStep(1);

  const handleBack = () => {
    router.push("/wallet");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Ganti jenis kartu -> gaya otomatis mengikuti jenisnya, warna kembali ke default
  const handleTypeChange = (next: CardType) => {
    if (next === type) return;
    setType(next);
    setStyleIndex(0);
    setSlideDirection("right");
    if (next === "BANK") setLogo("mastercard");
  };

  const goToStyle = (next: number) => {
    if (next < 0 || next >= options.length || next === safeIndex) return;
    setSlideDirection(next > safeIndex ? "right" : "left");
    setStyleIndex(next);
  };

  // Swipe: geser kiri = warna berikutnya, geser kanan = sebelumnya
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      goToStyle(safeIndex + 1);
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goToStyle(safeIndex - 1);
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nama kartu wajib diisi");
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      balance: balance === "" ? 0 : parseFloat(balance),
      cutoffDay: parseInt(cutoff),
      dueDay: parseInt(dueDay),
      dueOffset: parseInt(dueOffset),
      style: currentStyle.value,
      logo: previewLogo,
    };

    setSaving(true);
    try {
      const response = await fetch(
        isEdit ? `/api/cards/${card!.id}` : "/api/cards",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        toast.success(
          isEdit
            ? "Kartu berhasil diperbarui"
            : "Kartu baru berhasil ditambahkan",
        );
        onSaved();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gagal mengolah info kartu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  // Tombol "Lanjut" dan Enter di keyboard sama-sama lewat sini
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && step < LAST_STEP) {
      setStep((s) => s + 1);
      return;
    }
    save();
  };

  const handleDelete = async () => {
    if (!card) return;
    if (
      !confirm(
        "Kartu ini akan dihapus secara soft-delete. Transaksi terkait tidak akan dihapus. Lanjutkan?",
      )
    )
      return;

    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Kartu dihapus");
        onDeleted();
      } else {
        toast.error("Gagal menghapus kartu.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    }
  };

  const isLastStep = isEdit || step === LAST_STEP;

  return (
    <div className="min-h-screen bg-neutral-100 pb-10 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="fixed left-0 right-0 top-0 z-50">
        <IslandNavbar
          title={isEdit ? "Edit Kartu" : "Kartu Baru"}
          avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
          onAvatarPress={handleBack}
          actions={[]}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-md space-y-6 px-4 pt-[84px]">
          {/* Progress: tiga garis tipis (kartu baru saja) */}
          {!isEdit && (
            <div>
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={i > step}
                    onClick={() => setStep(i)}
                    aria-label={`Langkah ${i + 1}: ${s.label}`}
                    aria-current={i === step ? "step" : undefined}
                    className="flex h-5 flex-1 items-center disabled:cursor-default"
                  >
                    <span
                      className={`h-1 w-full rounded-full transition-colors duration-300 ${
                        i <= step
                          ? "bg-neutral-900 dark:bg-white"
                          : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
                Langkah {step + 1} dari {STEPS.length}
              </p>
              <p className="text-center text-base font-bold text-neutral-800 dark:text-neutral-100">
                {STEPS[step].title}
              </p>
            </div>
          )}

          {/* Preview kartu (selalu tampil; bisa di-slide saat langkah Tampilan) */}
          <section className="flex flex-col items-center">
            <div className="relative flex min-h-[220px] w-full items-center justify-center">
              <div className="relative flex w-full justify-center overflow-hidden">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={`${type}-${currentStyle.value}`}
                    custom={slideDirection}
                    variants={cardSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    // Spring cepat: kartu berikutnya tidak lama menunggu
                    transition={{
                      x: { type: "spring", stiffness: 520, damping: 40 },
                      opacity: { duration: 0.12 },
                      scale: { duration: 0.15 },
                    }}
                    drag={canSwipe ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={handleDragEnd}
                    style={{ touchAction: "pan-y" }}
                    className={`flex w-full justify-center ${
                      canSwipe ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                  >
                    <CreditCard
                      company={name || "Nama Kartu"}
                      cardType={config.label}
                      type={currentStyle.value}
                      logo={previewLogo}
                      balance={balance === "" ? 0 : parseFloat(balance) || 0}
                      balanceLabel="SALDO"
                      showBalance={true}
                      currency="IDR "
                      width={340}
                      className="shadow-2xl"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Kontrol slide warna */}
            {canSwipe && (
              <div className="flex flex-col items-center">
                {options.length > 1 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {options.map((o, i) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => goToStyle(i)}
                        aria-label={o.label}
                        className={`h-1.5 rounded-full transition-all ${
                          i === safeIndex
                            ? "w-5 bg-neutral-800 dark:bg-white"
                            : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  {currentStyle.label}
                </p>
              </div>
            )}
          </section>

          {/* Isi langkah */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isEdit ? "all" : step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Langkah 1: jenis kartu */}
              {showStep(0) && (
                <Group title="Jenis Kartu">
                  {CARD_TYPE_ORDER.map((t) => {
                    const selected = t === type;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-50 dark:active:bg-neutral-800/60"
                      >
                        <span>
                          <span className="block text-[15px] font-semibold">
                            {CARD_TYPE_CONFIG[t].label}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">
                            {CARD_TYPE_CONFIG[t].familyLabel}
                          </span>
                        </span>
                        {selected && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={22}
                            className="shrink-0 text-blue-600"
                          />
                        )}
                      </button>
                    );
                  })}
                </Group>
              )}

              {/* Langkah 2: jaringan pembayaran (hanya Debit/Bank) */}
              {showStep(1) && config.supportsNetwork && (
                <section>
                  <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Jaringan Pembayaran
                  </p>
                  <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 dark:bg-neutral-900">
                    {NETWORK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLogo(opt.value)}
                        className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                          logo === opt.value
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Langkah 2: info untuk jenis tanpa pilihan jaringan */}
              {!isEdit && step === 1 && !config.supportsNetwork && (
                <p className="px-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  Kartu {config.label} memakai gaya {config.familyLabel}. Cukup
                  pilih warna dengan menggeser kartu.
                </p>
              )}

              {/* Langkah 3: detail kartu */}
              {showStep(2) && (
                <>
                  <Group title="Detail">
                    <Row label="Nama">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="BCA Spending, GoPay"
                        className={rowInputCls}
                      />
                    </Row>
                    <Row label={type === "PAYLATER" ? "Limit" : "Saldo"}>
                      <span className="flex min-w-0 flex-1 items-baseline justify-end gap-1.5">
                        <span className="text-sm text-neutral-400">IDR</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          required
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                          placeholder="0"
                          className={rowInputCls}
                        />
                      </span>
                    </Row>
                  </Group>

                  {type === "PAYLATER" && (
                    <Group title="Aturan Billing Paylater">
                      <Row label="Tanggal cutoff">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="28"
                          value={cutoff}
                          onChange={(e) => setCutoff(e.target.value)}
                          className={rowInputCls}
                        />
                      </Row>
                      <Row label="Jatuh tempo (tgl)">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="28"
                          value={dueDay}
                          onChange={(e) => setDueDay(e.target.value)}
                          className={rowInputCls}
                        />
                      </Row>
                      <Row label="Bulan jatuh tempo">
                        <select
                          value={dueOffset}
                          onChange={(e) => setDueOffset(e.target.value)}
                          className={`${rowInputCls} cursor-pointer appearance-none`}
                        >
                          <option value="0">Bulan sama</option>
                          <option value="1">Bulan berikutnya</option>
                          <option value="2">2 bulan berikutnya</option>
                        </select>
                      </Row>
                    </Group>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Tombol aksi (ikut alur halaman, tidak menempel di bawah layar) */}
          <div className="space-y-2 pt-2">
            <div className="flex gap-3">
              {!isEdit && step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl bg-white px-5 py-3.5 text-xs font-bold text-neutral-700 transition-all active:scale-95 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  Kembali
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-60"
              >
                {isLastStep && (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                )}
                {saving
                  ? "Menyimpan..."
                  : isLastStep
                    ? "Simpan Kartu"
                    : "Lanjut"}
              </button>
            </div>

            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold text-red-500 transition-all active:scale-95"
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} />
                Hapus Kartu
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
