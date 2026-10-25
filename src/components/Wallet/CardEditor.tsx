"use client";

import React, { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  InformationCircleIcon,
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

const labelCls =
  "block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1.5";
const inputCls =
  "w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500";
const sectionCls =
  "bg-white dark:bg-neutral-900 border border-gray-200/70 dark:border-neutral-800 rounded-2xl p-4";

interface CardEditorProps {
  card: Card | null; // null = kartu baru
  onBack: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function CardEditor({
  card,
  onBack,
  onSaved,
  onDeleted,
}: CardEditorProps) {
  const isEdit = !!card;
  const initialType: CardType = card?.type ?? "BANK";

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
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans text-gray-900 dark:text-gray-100 pb-28 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-neutral-100/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-200/60 dark:border-neutral-900">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 active:scale-95 transition-all"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
          <h1 className="text-sm font-bold tracking-wide uppercase text-neutral-500">
            {isEdit ? "Edit Kartu" : "Tambah Kartu"}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
          {/* Progress steps (kartu baru saja) */}
          {!isEdit && (
            <div>
              <ol className="flex items-start px-1">
                {STEPS.map((s, i) => {
                  const done = i < step;
                  const active = i === step;
                  return (
                    <React.Fragment key={s.label}>
                      <li className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          disabled={i > step}
                          onClick={() => setStep(i)}
                          aria-label={`Langkah ${i + 1}: ${s.label}`}
                          aria-current={active ? "step" : undefined}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            done
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                              : active
                                ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                                : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                          }`}
                        >
                          {done ? (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              size={16}
                            />
                          ) : (
                            i + 1
                          )}
                        </button>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            active
                              ? "text-neutral-800 dark:text-white"
                              : "text-neutral-400 dark:text-neutral-500"
                          }`}
                        >
                          {s.label}
                        </span>
                      </li>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 mt-[15px] rounded-full transition-colors ${
                            i < step
                              ? "bg-neutral-900 dark:bg-white"
                              : "bg-neutral-200 dark:bg-neutral-800"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </ol>
              <p className="mt-4 text-center text-sm font-bold text-neutral-700 dark:text-neutral-200">
                {STEPS[step].title}
              </p>
            </div>
          )}

          {/* Preview kartu (selalu tampil; bisa di-slide saat langkah Tampilan) */}
          <section className="flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center min-h-[220px]">
              <div className="w-full overflow-hidden relative flex justify-center">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={`${type}-${currentStyle.value}`}
                    custom={slideDirection}
                    variants={cardSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 220, damping: 20 },
                      opacity: { duration: 0.2 },
                    }}
                    drag={canSwipe ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={handleDragEnd}
                    style={{ touchAction: "pan-y" }}
                    className={`w-full flex justify-center ${
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
                      width={350}
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
                  <div className="flex items-center gap-1.5 mt-1">
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
                  <span className="font-normal text-neutral-400 dark:text-neutral-500">
                    {" "}
                    · {config.familyLabel} · {safeIndex + 1}/{options.length}
                  </span>
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  Geser kartu ke kiri atau kanan untuk ganti warna
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
                <section className={sectionCls}>
                  <label className={labelCls}>Jenis Kartu</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CARD_TYPE_ORDER.map((t) => {
                      const selected = t === type;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTypeChange(t)}
                          className={`text-left rounded-xl border-2 px-3 py-2.5 active:scale-95 transition-all ${
                            selected
                              ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-950"
                              : "border-gray-200 dark:border-neutral-800"
                          }`}
                        >
                          <p className="text-xs font-bold">
                            {CARD_TYPE_CONFIG[t].label}
                          </p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                            {CARD_TYPE_CONFIG[t].familyLabel}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Langkah 2: jaringan pembayaran (hanya Debit/Bank) */}
              {showStep(1) && config.supportsNetwork && (
                <section className={sectionCls}>
                  <label className={labelCls}>Jaringan Pembayaran</label>
                  <div className="flex flex-wrap gap-2">
                    {NETWORK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLogo(opt.value)}
                        className={`px-3.5 py-2 rounded-full text-[11px] font-bold border active:scale-95 transition-all ${
                          logo === opt.value
                            ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                            : "bg-neutral-50 dark:bg-neutral-950 text-neutral-500 border-gray-200 dark:border-neutral-800"
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
                <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 px-6">
                  Kartu {config.label} memakai gaya {config.familyLabel}. Cukup
                  pilih warna dengan menggeser kartu.
                </p>
              )}

              {/* Langkah 3: detail kartu */}
              {showStep(2) && (
                <section className={`${sectionCls} space-y-4`}>
                  <div>
                    <label className={labelCls}>Nama Dompet / Kartu</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: BCA Spending, GoPay"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Saldo / Limit Awal</label>
                    <input
                      type="number"
                      required
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="0"
                      className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                  </div>

                  {type === "PAYLATER" && (
                    <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <HugeiconsIcon icon={InformationCircleIcon} size={13} />
                        Aturan Billing Paylater
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-rose-500 tracking-wide uppercase mb-1">
                            Cutoff Tanggal
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="28"
                            value={cutoff}
                            onChange={(e) => setCutoff(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-rose-500 tracking-wide uppercase mb-1">
                            DueDate Offset
                          </label>
                          <select
                            value={dueOffset}
                            onChange={(e) => setDueOffset(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                          >
                            <option value="0">Bulan Sama</option>
                            <option value="1">Bulan (+1)</option>
                            <option value="2">Bulan (+2)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-rose-500 tracking-wide uppercase mb-1">
                            Jatuh Tempo (Tgl)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="28"
                            value={dueDay}
                            onChange={(e) => setDueDay(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action bar */}
        <div className="fixed bottom-0 inset-x-0 z-20 bg-neutral-100/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-gray-200/60 dark:border-neutral-900">
          <div className="max-w-md mx-auto flex gap-3 px-4 py-3">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Hapus kartu"
                className="flex items-center justify-center p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 active:scale-95 transition-all"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </button>
            )}

            {!isEdit && step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-200 active:scale-95 transition-all"
              >
                Kembali
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs py-3 rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {isLastStep && (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
              )}
              {saving ? "Menyimpan..." : isLastStep ? "Simpan Kartu" : "Lanjut"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
