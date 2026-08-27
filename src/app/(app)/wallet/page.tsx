"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { CardList } from "@/components/Shared/CardList";
import { BankCard } from "@/components/Shared/BankCard";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft01Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons";

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

const getDeterministicCardTheme = (id: string, type: CardType, index: number) => {
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

// ─── CARD ITEM COMPONENT ──────────────────────────────────────────────────────

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
}

function CardItem({ card, index, onClick }: CardItemProps) {
  const theme = getDeterministicCardTheme(card.id, card.type, index);
  const lastFour = getLastFourDigits(card.id);
  const cardLogoType = index % 2 === 0 ? "visa" : "mastercard";

  return (
    <div className="relative group cursor-pointer active:scale-[0.99] transition-transform duration-150" onClick={onClick}>
      <BankCard
        variant="custom"
        style={{
          background: `linear-gradient(135deg, ${theme.color}, ${theme.colorEnd})`,
        }}
        className="text-white shadow-lg relative border border-white/10"
      >
        <BankCard.Header>
          <BankCard.Type className="text-white/80 uppercase font-mono tracking-wider text-[9px] bg-white/10 px-2 py-0.5 rounded-full">
            {card.type === "BANK" && "Debit Card"}
            {card.type === "EMONEY" && "E-Money"}
            {card.type === "EWALLET" && "E-Wallet"}
            {card.type === "PAYLATER" && "Paylater"}
          </BankCard.Type>
          <BankCard.Logo type={cardLogoType} />
        </BankCard.Header>

        <BankCard.Chip className="my-3 px-1" />

        <BankCard.Number value={lastFour} obscure={true} className="text-white/95 tracking-[0.25em] font-semibold my-4 px-1" />

        <BankCard.Footer className="mt-8">
          <div>
            <BankCard.Balance
              amount={card.balance}
              currency="IDR "
              allowMasking={true}
              className="text-white font-sans text-xl"
            />
            <BankCard.Holder name={card.name} className="mt-1 text-white/50 tracking-wider text-[10px] uppercase font-bold" />
          </div>
          <BankCard.Expiry date="12/29" />
        </BankCard.Footer>
      </BankCard>
      
      {/* Edit Overlay Indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-md p-1.5 rounded-full text-white/85">
        <HugeiconsIcon icon={Settings01Icon} size={14} />
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
  
  // Slide animation direction: "left" or "right"
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  // Transfer Filter State: "all" (semua) vs "current" (dari kartu ini)
  const [transferFilter, setTransferFilter] = useState<"all" | "current">("all");

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
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split("T")[0]);

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
        setCards(cardsData.cards || []);
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

  // Total balance sum calculations
  const totalCashBalance = cards
    .filter((c) => c.type !== "PAYLATER")
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPaylaterLimit = cards
    .filter((c) => c.type === "PAYLATER")
    .reduce((sum, c) => sum + c.balance, 0);

  // Carousel navigation mechanics
  const cardsCount = cards.length + 1; // +1 for the Total Card

  const handlePrevCard = () => {
    setSlideDirection("left");
    setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : cardsCount - 1));
  };

  const handleNextCard = () => {
    setSlideDirection("right");
    setActiveCardIndex((prev) => (prev < cardsCount - 1 ? prev + 1 : 0));
  };

  // Get active item details
  const isTotalCardActive = activeCardIndex === 0;
  const activeCardObject = isTotalCardActive ? null : cards[activeCardIndex - 1];

  // Filtering Transfers history based on active card + selected tab
  const filteredTransfers = transfers.filter((tr) => {
    if (transferFilter === "all" || isTotalCardActive || !activeCardObject) {
      return true;
    }
    // Filter specifically involving the currently selected active card
    const targetCardId = activeCardObject.id;
    return tr.fromCardId === targetCardId || tr.toCardId === targetCardId;
  });

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
        toast.success(selectedCard ? "Kartu berhasil diperbarui" : "Kartu baru berhasil ditambahkan");
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
    if (!confirm("Kartu ini akan dihapus secara soft-delete. Transaksi terkait tidak akan dihapus. Lanjutkan?")) return;

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
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -150 : 150,
      opacity: 0,
      scale: 0.96
    })
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
        
        {/* CAROUSEL SECTION */}
        <section className="relative flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
              {isTotalCardActive ? "Ringkasan Saldo" : "Rincian Kartu"}
            </h3>
            
            {/* Card Counter indicator */}
            <span className="text-[10px] bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono text-neutral-400">
              {activeCardIndex + 1} / {cardsCount}
            </span>
          </div>

          <div className="relative w-full flex items-center justify-center gap-1 min-h-[220px]">
            {/* Left navigation arrow */}
            <button
              onClick={handlePrevCard}
              className="absolute left-[-10px] z-10 w-9 h-9 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md text-neutral-600 dark:text-neutral-300 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
              aria-label="Previous card"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>

            {/* Carousel Active Content Frame */}
            <div className="w-full overflow-visible relative flex justify-center">
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={activeCardIndex}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 220, damping: 20 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full"
                >
                  {isTotalCardActive ? (
                    /* TOTAL BALANCE CARD (Index 0) */
                    <div 
                      className="cursor-default select-none transition-transform duration-100"
                      onClick={() => toast.info("Kartu total akumulasi cash seluruh rekening Anda.")}
                    >
                      <BankCard
                        variant="custom"
                        style={{
                          background: "linear-gradient(135deg, #111827 0%, #374151 50%, #1f2937 100%)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.3)"
                        }}
                        className="text-white relative border border-white/10"
                      >
                        <BankCard.Header>
                          <BankCard.Type className="text-white/80 uppercase font-mono tracking-widest text-[9px] bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/10">
                            Total Accounts
                          </BankCard.Type>
                          <BankCard.Logo type="mastercard" />
                        </BankCard.Header>

                        <BankCard.Chip className="my-2.5 px-1" />

                        <BankCard.Number value="8888" obscure={true} className="text-white/70 tracking-[0.2em] font-semibold my-4 px-1" />

                        <BankCard.Footer className="mt-8">
                          <div>
                            <BankCard.Balance
                              amount={totalCashBalance}
                              currency="IDR "
                              allowMasking={false}
                              className="text-white font-sans text-2xl font-bold font-mono"
                            />
                            <BankCard.Holder name="ALL ACTIVE CASH WALLETS" className="mt-1 text-white/50 tracking-wider text-[9px] uppercase font-bold" />
                          </div>
                          
                          <div className="flex flex-col items-end opacity-90">
                            <span className="text-[8px] uppercase tracking-widest text-neutral-450 leading-none">Paylater limit</span>
                            <span className="text-xs font-mono font-bold text-rose-400 mt-1">
                              IDR {formatIDR(totalPaylaterLimit)}
                            </span>
                          </div>
                        </BankCard.Footer>
                      </BankCard>
                    </div>
                  ) : (
                    /* INDIVIDUAL CARD CARD (Index 1..N) */
                    activeCardObject && (
                      <CardItem
                        card={activeCardObject}
                        index={activeCardIndex}
                        onClick={() => openEditCardModal(activeCardObject)}
                      />
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right navigation arrow */}
            <button
              onClick={handleNextCard}
              className="absolute right-[-10px] z-10 w-9 h-9 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md text-neutral-600 dark:text-neutral-300 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
              aria-label="Next card"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
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
            {!isTotalCardActive && activeCardObject && (
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
              <div className="w-full h-12 rounded-xl bg-neutral-200 dark:bg-neutral-900 animate-pulse border border-gray-200/50 dark:border-white/5" />
              <div className="w-full h-12 rounded-xl bg-neutral-200 dark:bg-neutral-900 animate-pulse border border-gray-200/50 dark:border-white/5" />
            </div>
          ) : filteredTransfers.length > 0 ? (
            <CardList
              items={filteredTransfers}
              keyExtractor={(tr) => tr.id}
              renderItem={(tr) => {
                const isPaylater = tr.fromCardType === "PAYLATER" || tr.toCardType === "PAYLATER";
                const bgType = isPaylater
                  ? "bg-rose-100 dark:bg-rose-950/20"
                  : "bg-blue-100 dark:bg-blue-950/20";
                
                const iconColor = isPaylater ? "text-rose-600" : "text-blue-600";
                const relativeDate = new Date(tr.time).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return {
                  left: (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgType}`}>
                        <HugeiconsIcon icon={isPaylater ? Invoice02Icon : BankIcon} size={16} className={iconColor} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold leading-tight">
                          {tr.targetName}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">
                          {tr.bankName} • {relativeDate}
                        </p>
                      </div>
                    </div>
                  ),
                  right: (
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                        IDR {formatIDR(tr.amount)}
                      </p>
                      <p className="text-[9px] text-gray-400 dark:text-neutral-500 mt-0.5 uppercase font-medium">
                        Outgoing
                      </p>
                    </div>
                  ),
                };
              }}
            />
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
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-2">Desain Pratinjau</div>
                <div className="scale-95 origin-top transition-all duration-300">
                  {/* Pratinjau */}
                  <BankCard
                    variant="custom"
                    style={{
                      background: `linear-gradient(135deg, ${
                        cardFormType === "BANK" ? "#1A3FA8" :
                        cardFormType === "EMONEY" ? "#0F766E" :
                        cardFormType === "EWALLET" ? "#4F46E5" : "#E11D48" // PAYLATER
                      }, ${
                        cardFormType === "BANK" ? "#0C1A5A" :
                        cardFormType === "EMONEY" ? "#115E59" :
                        cardFormType === "EWALLET" ? "#3730A3" : "#9F1239" // PAYLATER
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

                    <BankCard.Number value="7890" obscure={true} className="text-white/95 font-semibold my-4 px-1" />

                    <BankCard.Footer className="mt-6">
                      <div>
                        <BankCard.Balance
                          amount={cardFormBalance === "" ? 0 : parseFloat(cardFormBalance)}
                          currency="IDR "
                          allowMasking={false}
                          className="text-white font-sans text-[18px]"
                        />
                        <BankCard.Holder name={cardFormName || "Nama Pemilik"} className="mt-1 text-white/50 tracking-wider text-[9px] uppercase font-bold" />
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
                      onChange={(e) => setCardFormType(e.target.value as CardType)}
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
                  <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={15} />
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