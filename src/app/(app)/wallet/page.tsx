"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
// import { CardList } from "@/components/Shared/CardList";
import { BankCard } from "@/components/Shared/BankCard";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { toast } from "sonner";
import {
  Add01Icon,
  ArrowDataTransferDiagonalIcon,
  Invoice02Icon,
  Settings01Icon,
  UserIcon,
  BankIcon,
  Cancel01Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  ArrowDataTransferHorizontalIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { CreditCard } from "@/components/ui/credit-card/credit-card";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CardType = "BANK" | "EMONEY" | "EWALLET" | "PAYLATER";

interface Card {
  id: string;
  name: string;
  type: CardType;
  balance: number;
  cutoffDay?: number | null;
  dueDay?: number | null;
  dueOffset?: number | null;
}

interface TransferHistoryItem {
  id: string;
  targetName: string;
  bankName: string;
  time: string;
  amount: number;
  type: "send" | "receive";
  fromCardType: CardType;
  toCardType: CardType;
  fromCardId: string;
  toCardId: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

const getDeterministicCardTheme = (
  id: string,
  type: CardType,
  index: number,
) => {
  const themes = [
    { color: "#1A3FA8", colorEnd: "#0C1A5A" }, // Deep Blue (default BANK)
    { color: "#0F766E", colorEnd: "#115E59" }, // Emerald (default EMONEY)
    { color: "#4F46E5", colorEnd: "#3730A3" }, // Indigo (default EWALLET)
    { color: "#E11D48", colorEnd: "#9F1239" }, // Ruby (default PAYLATER)
    { color: "#374151", colorEnd: "#1F2937" }, // Gray
  ];

  if (type === "BANK") return themes[0];
  if (type === "EMONEY") return themes[1];
  if (type === "EWALLET") return themes[2];
  if (type === "PAYLATER") return themes[3];

  return themes[index % themes.length];
};

const getLastFourDigits = (id: string) => {
  if (!id) return "0000";
  const numOnly = id.replace(/[^0-9]/g, "");
  if (numOnly.length >= 4) return numOnly.slice(-4);

  // Deterministic fallback
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return String(sum).slice(-4).padEnd(4, "7");
};

// ─── HELPERS: CARD TYPE → CREDITCARD STYLE ────────────────────────────────────

type CreditCardStyle =
  | "brand-dark"
  | "brand-light"
  | "gray-dark"
  | "gray-light"
  | "transparent"
  | "gradient-strip"
  | "salmon-strip";

const getCardStyle = (type: CardType): CreditCardStyle => {
  if (type === "BANK") return "brand-dark";
  if (type === "EMONEY") return "gray-dark";
  if (type === "EWALLET") return "gradient-strip";
  if (type === "PAYLATER") return "salmon-strip";
  return "brand-dark";
};

const getCardTypeLabel = (type: CardType): string => {
  if (type === "BANK") return "Debit";
  if (type === "EMONEY") return "E-Money";
  if (type === "EWALLET") return "E-Wallet";
  if (type === "PAYLATER") return "Paylater";
  return type;
};

const getDayLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const groupTransfersByDay = (items: TransferHistoryItem[]) => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
  const groups: { label: string; items: TransferHistoryItem[] }[] = [];

  for (const tr of sorted) {
    const label = getDayLabel(new Date(tr.time));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(tr);
    else groups.push({ label, items: [tr] });
  }
  return groups;
};

// ─── CARD ITEM COMPONENT ──────────────────────────────────────────────────────

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
}

function CardItem({ card, onClick }: CardItemProps) {
  const cardStyle = getCardStyle(card.type);
  const typeLabel = getCardTypeLabel(card.type);

  return (
    <div
      className="relative group cursor-pointer active:scale-[0.99] transition-transform duration-150 flex justify-center"
      onClick={onClick}
    >
      <CreditCard
        company={card.name}
        cardHolder={typeLabel}
        cardExpiration="—"
        type={cardStyle}
        balance={card.balance}
        balanceLabel="SALDO"
        showBalance={true}
        currency="IDR "
        width={316}
        className="shadow-2xl"
      />
      {/* Edit Overlay Indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-md p-1.5 rounded-full text-white/85">
        <HugeiconsIcon icon={Settings01Icon} size={14} />
      </div>
    </div>
  );
}

// ─── TRANSFER ROW COMPONENT ───────────────────────────────────────────────────

interface TransferRowProps {
  tr: TransferHistoryItem;
  fromCard?: Card;
  toCard?: Card;
}

function TransferRow({ tr, fromCard, toCard }: TransferRowProps) {
  const isPaylater =
    tr.fromCardType === "PAYLATER" || tr.toCardType === "PAYLATER";

  const timeLabel = new Date(tr.time).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fromName = fromCard?.name ?? "Kartu dihapus";
  const toName =
    toCard?.name ?? (tr.targetName || tr.bankName || "Kartu dihapus");

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
      {/* Asal */}
      <div className="min-w-0">
        <p className="text-[13px] font-bold tabular-nums leading-tight text-rose-600 dark:text-rose-400 truncate">
          − {formatIDR(tr.amount)}
        </p>
        <p className="text-[11px] mt-0.5 text-gray-500 dark:text-neutral-400 truncate">
          {fromName}
        </p>
      </div>

      {/* Tengah: ikon + jam */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isPaylater
              ? "bg-rose-50 text-rose-500 dark:bg-rose-950/30"
              : "bg-blue-50 text-blue-500 dark:bg-blue-950/30"
          }`}
        >
          <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={14} />
        </div>
        <span className="text-[10px] font-mono tabular-nums text-gray-400 dark:text-neutral-500">
          {timeLabel}
        </span>
      </div>

      {/* Tujuan */}
      <div className="min-w-0 text-right">
        <p className="text-[13px] font-bold tabular-nums leading-tight text-emerald-600 dark:text-emerald-400 truncate">
          + {formatIDR(tr.amount)}
        </p>
        <p className="text-[11px] mt-0.5 text-gray-500 dark:text-neutral-400 truncate">
          {toName}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function WalletPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [transfers, setTransfers] = useState<TransferHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carousel Selection State
  // 0 = Total Balance Card, 1..N = Individual cards
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Mencegah klik (buka modal edit) ikut terpicu saat user baru selesai swipe
  const isDraggingRef = React.useRef(false);

  // Slide animation direction: "left" or "right"
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right",
  );

  // Transfer Filter State: "all" (semua) vs "current" (dari kartu ini)
  const [transferFilter, setTransferFilter] = useState<"all" | "current">(
    "all",
  );

  // Modals visibility state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Modal forms active data
  const [selectedCard, setSelectedCard] = useState<Card | null>(null); // null means "new card"

  // Card Form State
  const [cardFormName, setCardFormName] = useState("");
  const [cardFormType, setCardFormType] = useState<CardType>("BANK");
  const [cardFormBalance, setCardFormBalance] = useState("");
  // Paylater configs
  const [cardFormCutoff, setCardFormCutoff] = useState("20");
  const [cardFormDueDay, setCardFormDueDay] = useState("5");
  const [cardFormDueOffset, setCardFormDueOffset] = useState("1");

  // Transfer Form State
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferFee, setTransferFee] = useState("0");
  const [transferDate, setTransferDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, transfersRes] = await Promise.all([
        fetch("/api/cards"),
        fetch("/api/cards/transfers"),
      ]);

      if (cardsRes.ok && transfersRes.ok) {
        const cardsData = await cardsRes.json();
        const transfersData = await transfersRes.json();
        const sortedCards: Card[] = [...(cardsData.cards || [])].sort(
          (a: Card, b: Card) => b.balance - a.balance,
        );
        setCards(sortedCards);
        setActiveCardIndex((prev) =>
          Math.min(prev, Math.max(sortedCards.length - 1, 0)),
        );
        setTransfers(transfersData.transfers || []);
      } else {
        toast.error("Gagal memuat beberapa layanan finansial.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Masalah koneksi dengan server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carousel navigation mechanics
  const cardsCount = cards.length;

  const goToCard = (next: number) => {
    if (next < 0 || next >= cardsCount || next === activeCardIndex) return;
    setSlideDirection(next > activeCardIndex ? "right" : "left");
    setActiveCardIndex(next);
  };

  // Swipe handler: geser kiri = kartu berikutnya, geser kanan = sebelumnya
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const SWIPE_DISTANCE = 60;
    const SWIPE_VELOCITY = 500;

    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      goToCard(activeCardIndex + 1);
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      goToCard(activeCardIndex - 1);
    }

    // Beri jeda singkat agar onClick tidak terpicu setelah drag
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Get active item details
  const activeCardObject = cards[activeCardIndex] ?? null;

  // Filtering Transfers history based on active card + selected tab
  const filteredTransfers = transfers.filter((tr) => {
    if (transferFilter === "all" || !activeCardObject) {
      return true;
    }
    // Filter specifically involving the currently selected active card
    const targetCardId = activeCardObject.id;
    return tr.fromCardId === targetCardId || tr.toCardId === targetCardId;
  });

  // Lookup kartu by id untuk menampilkan nama asal & tujuan di riwayat transfer
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const groupedTransfers = groupTransfersByDay(filteredTransfers);

  // Open Add Card modal
  const openNewCardModal = () => {
    setSelectedCard(null);
    setCardFormName("");
    setCardFormType("BANK");
    setCardFormBalance("");
    setCardFormCutoff("20");
    setCardFormDueDay("5");
    setCardFormDueOffset("1");
    setIsCardModalOpen(true);
  };

  // Open Edit Card modal
  const openEditCardModal = (card: Card) => {
    setSelectedCard(card);
    setCardFormName(card.name);
    setCardFormType(card.type);
    setCardFormBalance(String(card.balance));
    setCardFormCutoff(String(card.cutoffDay || 20));
    setCardFormDueDay(String(card.dueDay || 5));
    setCardFormDueOffset(String(card.dueOffset || 1));
    setIsCardModalOpen(true);
  };

  // Handle Card Submit (Create / Edit)
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFormName.trim()) {
      toast.error("Nama kartu wajib diisi");
      return;
    }

    const payload = {
      name: cardFormName,
      type: cardFormType,
      balance: cardFormBalance === "" ? 0 : parseFloat(cardFormBalance),
      cutoffDay: parseInt(cardFormCutoff),
      dueDay: parseInt(cardFormDueDay),
      dueOffset: parseInt(cardFormDueOffset),
    };

    try {
      let response;
      if (selectedCard) {
        // Edit Mode
        response = await fetch(`/api/cards/${selectedCard.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create Mode
        response = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast.success(
          selectedCard
            ? "Kartu berhasil diperbarui"
            : "Kartu baru berhasil ditambahkan",
        );
        setIsCardModalOpen(false);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gagal mengolah info kartu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    }
  };

  // Handle Card Delete
  const handleCardDelete = async () => {
    if (!selectedCard) return;
    if (
      !confirm(
        "Kartu ini akan dihapus secara soft-delete. Transaksi terkait tidak akan dihapus. Lanjutkan?",
      )
    )
      return;

    try {
      const response = await fetch(`/api/cards/${selectedCard.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Kartu dihapus");
        setIsCardModalOpen(false);
        setActiveCardIndex(0); // Reset selection to total
        loadData();
      } else {
        toast.error("Gagal menghapus kartu.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    }
  };

  // Open Transfer modal
  const openTransferModal = () => {
    if (cards.length < 2) {
      toast.error("Buat minimal 2 kartu untuk melakukan transfer.");
      return;
    }
    setTransferFromId(cards[0].id);
    setTransferToId(cards[1]?.id || "");
    setTransferAmount("");
    setTransferFee("0");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setIsTransferModalOpen(true);
  };

  // Handle Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId || !transferAmount) {
      toast.error("Isi semua bidang utama transfer");
      return;
    }

    const payload = {
      fromCardId: transferFromId,
      toCardId: transferToId,
      amount: parseFloat(transferAmount),
      fee: parseFloat(transferFee || "0"),
      date: transferDate,
    };

    try {
      const res = await fetch("/api/cards/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Transfer berhasil diproses");
        setIsTransferModalOpen(false);
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal memproses transfer");
      }
    } catch (error) {
      console.error(error);
      toast.error("Kesalahan jaringan.");
    }
  };

  // Carousel slide animations variants
  const slideVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 150 : -150,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -150 : 150,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black font-sans pb-24 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Header */}
      <IslandNavbar
        title="Wallet"
        actions={[
          {
            icon: <HugeiconsIcon icon={Add01Icon} size={18} />,
            label: "Add Card",
            onPress: openNewCardModal,
          },
        ]}
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* CAROUSEL KARTU (SWIPE) */}
        <section className="relative flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
              Rincian Kartu
            </h3>

            {/* Card Counter indicator */}
            {cardsCount > 0 && (
              <span className="text-[10px] bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono text-neutral-400">
                {activeCardIndex + 1} / {cardsCount}
              </span>
            )}
          </div>

          <div className="relative w-full flex items-center justify-center min-h-[220px]">
            {/* Carousel Active Content Frame */}
            <div className="w-full overflow-hidden relative flex justify-center">
              {loading ? (
                <div className="w-[316px] h-[200px] rounded-2xl bg-neutral-200 dark:bg-neutral-900 animate-pulse" />
              ) : activeCardObject ? (
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={activeCardObject.id}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 220, damping: 20 },
                      opacity: { duration: 0.2 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={handleDragEnd}
                    style={{ touchAction: "pan-y" }}
                    className="w-full cursor-grab active:cursor-grabbing"
                  >
                    <CardItem
                      card={activeCardObject}
                      index={activeCardIndex}
                      onClick={() => {
                        if (isDraggingRef.current) return;
                        openEditCardModal(activeCardObject);
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="w-[316px] h-[200px] rounded-2xl border border-dashed border-gray-300 dark:border-neutral-800 flex items-center justify-center text-xs text-gray-400 dark:text-neutral-600">
                  Belum ada kartu
                </div>
              )}
            </div>
          </div>

          {/* Dot indicator */}
          {cardsCount > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => goToCard(i)}
                  aria-label={`Kartu ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeCardIndex
                      ? "w-5 bg-neutral-800 dark:bg-white"
                      : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Action Controls */}
        <div className="flex gap-4">
          <button
            onClick={openNewCardModal}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 py-3.5 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all text-gray-600 dark:text-gray-200"
          >
            <HugeiconsIcon icon={Add01Icon} size={15} />
            Tambah Kartu
          </button>

          <button
            onClick={openTransferModal}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-3.5 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95 transition-all"
          >
            <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={15} />
            Kirim Transfer
          </button>
        </div>

        {/* Transfer History with Filter */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
              Transfer History
            </h3>

            {/* Filter Tabs / Controls */}
            {activeCardObject && (
              <div className="flex bg-neutral-200 dark:bg-neutral-900 border border-neutral-300/30 dark:border-neutral-800 p-0.5 rounded-full text-[10px] w-fit self-end font-semibold">
                <button
                  onClick={() => setTransferFilter("all")}
                  className={`px-3 py-1 rounded-full active:scale-95 transition-all ${
                    transferFilter === "all"
                      ? "bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTransferFilter("current")}
                  className={`px-3 py-1 rounded-full active:scale-95 transition-all max-w-[120px] truncate ${
                    transferFilter === "current"
                      ? "bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Dari Kartu Ini
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="w-full h-[84px] rounded-2xl bg-neutral-200 dark:bg-neutral-900 animate-pulse border border-gray-200/50 dark:border-white/5" />
              <div className="w-full h-[84px] rounded-2xl bg-neutral-200 dark:bg-neutral-900 animate-pulse border border-gray-200/50 dark:border-white/5" />
            </div>
          ) : filteredTransfers.length > 0 ? (
            <div className="space-y-5">
              {groupedTransfers.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h4 className="px-1 text-[11px] font-semibold text-gray-400 dark:text-neutral-500">
                    {group.label}
                  </h4>
                  <div className="bg-white dark:bg-neutral-900 border border-gray-200/70 dark:border-neutral-800 rounded-2xl divide-y divide-gray-100 dark:divide-neutral-800 overflow-hidden">
                    {group.items.map((tr) => (
                      <TransferRow
                        key={tr.id}
                        tr={tr}
                        fromCard={cardById.get(tr.fromCardId)}
                        toCard={cardById.get(tr.toCardId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl">
              <p className="text-xs text-gray-400 dark:text-neutral-600">
                {transferFilter === "current"
                  ? "Belum ada transaksi transfer untuk kartu ini"
                  : "Belum ada riwayat transfer"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── CARD MODEL (ADD/EDIT) ── */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm sm:max-w-md bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-800 rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 px-6 py-4">
                <h4 className="text-sm font-bold tracking-wide uppercase text-neutral-500">
                  {selectedCard ? "Edit Kartu" : "Tambah Kartu"}
                </h4>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              {/* Dynamic Design Preview Card inside forms */}
              <div className="px-6 pt-5 pb-2">
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-2">
                  Desain Pratinjau
                </div>
                <div className="scale-95 origin-top transition-all duration-300">
                  {/* Pratinjau */}
                  <BankCard
                    variant="custom"
                    style={{
                      background: `linear-gradient(135deg, ${
                        cardFormType === "BANK"
                          ? "#1A3FA8"
                          : cardFormType === "EMONEY"
                            ? "#0F766E"
                            : cardFormType === "EWALLET"
                              ? "#4F46E5"
                              : "#E11D48" // PAYLATER
                      }, ${
                        cardFormType === "BANK"
                          ? "#0C1A5A"
                          : cardFormType === "EMONEY"
                            ? "#115E59"
                            : cardFormType === "EWALLET"
                              ? "#3730A3"
                              : "#9F1239" // PAYLATER
                      })`,
                    }}
                    className="text-white border border-white/10"
                  >
                    <BankCard.Header>
                      <BankCard.Type className="text-white/80 uppercase font-mono tracking-wider text-[8px] bg-white/10 px-2 py-0.5 rounded-full">
                        {cardFormType === "BANK" && "Debit Card"}
                        {cardFormType === "EMONEY" && "E-Money"}
                        {cardFormType === "EWALLET" && "E-Wallet"}
                        {cardFormType === "PAYLATER" && "Paylater"}
                      </BankCard.Type>
                      <BankCard.Logo type="visa" />
                    </BankCard.Header>

                    <BankCard.Chip className="my-3 px-1" />

                    <BankCard.Number
                      value="7890"
                      obscure={true}
                      className="text-white/95 font-semibold my-4 px-1"
                    />

                    <BankCard.Footer className="mt-6">
                      <div>
                        <BankCard.Balance
                          amount={
                            cardFormBalance === ""
                              ? 0
                              : parseFloat(cardFormBalance)
                          }
                          currency="IDR "
                          allowMasking={false}
                          className="text-white font-sans text-[18px]"
                        />
                        <BankCard.Holder
                          name={cardFormName || "Nama Pemilik"}
                          className="mt-1 text-white/50 tracking-wider text-[9px] uppercase font-bold"
                        />
                      </div>
                      <BankCard.Expiry date="12/29" />
                    </BankCard.Footer>
                  </BankCard>
                </div>
              </div>

              <form onSubmit={handleCardSubmit} className="p-6 space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                    Nama Dompet / Kartu
                  </label>
                  <input
                    type="text"
                    required
                    value={cardFormName}
                    onChange={(e) => setCardFormName(e.target.value)}
                    placeholder="Contoh: BCA Spending, GoPay"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                      Tipe Kartu
                    </label>
                    <select
                      value={cardFormType}
                      onChange={(e) =>
                        setCardFormType(e.target.value as CardType)
                      }
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="BANK">Bank (Debit)</option>
                      <option value="EMONEY">Kartu Flazz/E-Money</option>
                      <option value="EWALLET">Dompet Digital</option>
                      <option value="PAYLATER">Sistem Paylater</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                      Saldo / Limit Awal
                    </label>
                    <input
                      type="number"
                      required
                      value={cardFormBalance}
                      onChange={(e) => setCardFormBalance(e.target.value)}
                      placeholder="0"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Info Tambahan Jika PAYLATER */}
                {cardFormType === "PAYLATER" && (
                  <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4.5 space-y-3">
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <HugeiconsIcon icon={InformationCircleIcon} size={13} />
                      Aturan Billing Paylater
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-rose-450 dark:text-rose-350 tracking-wide uppercase mb-1">
                          Cutoff Tanggal
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={cardFormCutoff}
                          onChange={(e) => setCardFormCutoff(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-rose-450 dark:text-rose-350 tracking-wide uppercase mb-1">
                          DueDate Offset
                        </label>
                        <select
                          value={cardFormDueOffset}
                          onChange={(e) => setCardFormDueOffset(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                        >
                          <option value="0">Bulan Sama</option>
                          <option value="1">Bulan (+1)</option>
                          <option value="2">Bulan (+2)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-rose-450 dark:text-rose-350 tracking-wide uppercase mb-1">
                          Jatuh Tempo (Tgl)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={cardFormDueDay}
                          onChange={(e) => setCardFormDueDay(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {selectedCard && (
                    <button
                      type="button"
                      onClick={handleCardDelete}
                      className="flex items-center justify-center p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 transition-all shadow-sm active:scale-95"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-transparent font-bold text-xs py-3 rounded-xl hover:bg-neutral-850 dark:hover:bg-neutral-100 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                    Simpan Kartu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TRANSFER MODAL ── */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm sm:max-w-md bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-800 rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-805 px-6 py-4">
                <h4 className="text-sm font-bold tracking-wide uppercase text-neutral-500">
                  Kirim Transfer Internal
                </h4>
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                      Kartu Asal
                    </label>
                    <select
                      value={transferFromId}
                      onChange={(e) => setTransferFromId(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-450 tracking-wide uppercase mb-1">
                      Kartu Tujuan
                    </label>
                    <select
                      value={transferToId}
                      onChange={(e) => setTransferToId(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {cards
                        .filter((c) => c.id !== transferFromId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                      Jumlah Transfer
                    </label>
                    <input
                      type="number"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                      Biaya Admin (Fee)
                    </label>
                    <input
                      type="number"
                      value={transferFee}
                      onChange={(e) => setTransferFee(e.target.value)}
                      placeholder="0"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wide uppercase mb-1">
                    Tanggal Transfer
                  </label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
                >
                  <HugeiconsIcon
                    icon={ArrowDataTransferDiagonalIcon}
                    size={15}
                  />
                  Kirim Transfer Sekarang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
