"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { CardEditor, type Card } from "@/components/Wallet/CardEditor";
import { TransferEditor } from "@/components/Wallet/TransferEditor";
import { canSendTransfer, canReceiveTransfer } from "@/lib/transferRules";
import {
  CARD_TYPE_CONFIG,
  resolveCardLogo,
  resolveCardStyle,
  type CardType,
} from "@/components/Wallet/CardStyles";
import {
  motion,
  animate,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { toast } from "sonner";
import {
  CreditCardAddIcon,
  ArrowDataTransferDiagonalIcon,
  ArrowDataTransferHorizontalIcon,
  Settings01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import {
  CreditCard,
  getCardHeight,
} from "@/components/ui/credit-card/credit-card";

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

const CARD_WIDTH = 340;
const CARD_HEIGHT = getCardHeight(CARD_WIDTH); // 210

interface CardItemProps {
  card: Card;
  onClick: () => void;
}

function CardItem({ card, onClick }: CardItemProps) {
  const cardStyle = resolveCardStyle(card.type, card.style);
  const typeLabel = CARD_TYPE_CONFIG[card.type].label;

  return (
    <div
      className="relative group cursor-pointer active:scale-[0.99] transition-transform duration-150 flex justify-center"
      onClick={onClick}
    >
      <CreditCard
        company={card.name}
        stakeholder={card.stakeholder}
        cardType={typeLabel}
        type={cardStyle}
        logo={resolveCardLogo(card.type, card.logo)}
        balance={card.balance}
        balanceLabel="SALDO"
        showBalance={true}
        currency="IDR "
        width={CARD_WIDTH}
        className="shadow-2xl"
      />
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

  // Carousel: index 0 = kartu dengan saldo terbesar (default)
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Mencegah klik (buka editor) ikut terpicu saat user baru selesai swipe
  const isDraggingRef = useRef(false);

  const reduceMotion = useReducedMotion();

  // Posisi jalur kartu (px). Mengikuti jari saat drag, lalu snap ke kartu aktif.
  const trackX = useMotionValue(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const releaseVelocityRef = useRef(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Ukur lebar bingkai carousel (callback ref, aman saat editor dibuka/ditutup)
  const frameRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    setSlideWidth(node.clientWidth);
    const observer = new ResizeObserver(() => setSlideWidth(node.clientWidth));
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Geser jalur ke kartu aktif setiap indeks atau lebar berubah
  useEffect(() => {
    if (!slideWidth) return;
    const controls = animate(trackX, -activeCardIndex * slideWidth, {
      type: "spring",
      stiffness: 420,
      damping: 42,
      mass: 0.9,
      velocity: releaseVelocityRef.current,
      ...(reduceMotion ? { type: "tween", duration: 0 } : {}),
    });
    releaseVelocityRef.current = 0;
    return () => controls.stop();
  }, [activeCardIndex, slideWidth, trackX, reduceMotion]);

  // Filter transfer: "all" (semua) vs "current" (kartu ini)
  const [transferFilter, setTransferFilter] = useState<"all" | "current">(
    "all",
  );

  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Halaman add/edit kartu (card = null berarti kartu baru)
  const [editorState, setEditorState] = useState<{
    open: boolean;
    card: Card | null;
  }>({ open: false, card: null });

  // Fetch data
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

  // Carousel navigation
  const cardsCount = cards.length;

  const goToCard = (next: number) => {
    if (next < 0 || next >= cardsCount || next === activeCardIndex) return;
    setActiveCardIndex(next);
  };

  // Lepas jari: tentukan kartu tujuan dari jarak dan kecepatan geser
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const SWIPE_DISTANCE = 50;
    const SWIPE_VELOCITY = 400;

    let next = activeCardIndex;
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      next = activeCardIndex + 1;
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      next = activeCardIndex - 1;
    }
    next = Math.min(Math.max(next, 0), cardsCount - 1);

    releaseVelocityRef.current = info.velocity.x;
    if (next === activeCardIndex) {
      // Tidak pindah kartu: kembalikan ke posisi semula
      animate(trackX, -activeCardIndex * slideWidth, {
        type: "spring",
        stiffness: 420,
        damping: 42,
        velocity: info.velocity.x,
      });
      releaseVelocityRef.current = 0;
    } else {
      setActiveCardIndex(next);
    }

    // Jeda singkat agar onClick tidak terpicu setelah drag
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const activeCardObject = cards[activeCardIndex] ?? null;

  // Filter transfer berdasarkan kartu aktif + tab
  const filteredTransfers = transfers.filter((tr) => {
    if (transferFilter === "all" || !activeCardObject) return true;
    const targetCardId = activeCardObject.id;
    return tr.fromCardId === targetCardId || tr.toCardId === targetCardId;
  });

  // Lookup kartu by id untuk nama asal & tujuan di riwayat
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const groupedTransfers = groupTransfersByDay(filteredTransfers);

  // Editor handlers
  const openNewCardEditor = () => setEditorState({ open: true, card: null });
  const openEditCardEditor = (card: Card) =>
    setEditorState({ open: true, card });
  const closeEditor = () => setEditorState({ open: false, card: null });

  const openTransferPage = () => {
    const senders = cards.filter((c) => canSendTransfer(c.type));
    const receivers = cards.filter((c) => canReceiveTransfer(c.type));
    const hasPair = senders.some((s) => receivers.some((r) => r.id !== s.id));

    if (!hasPair) {
      toast.error(
        "Transfer butuh satu kartu Bank/E-Wallet sebagai pengirim dan satu kartu lain sebagai penerima.",
      );
      return;
    }
    setIsTransferOpen(true);
  };

  // Halaman editor kartu (semua hook sudah dipanggil di atas, jadi aman)
  if (editorState.open) {
    return (
      <CardEditor
        card={editorState.card}
        onBack={closeEditor}
        onSaved={() => {
          closeEditor();
          loadData();
        }}
        onDeleted={() => {
          closeEditor();
          setActiveCardIndex(0);
          loadData();
        }}
      />
    );
  }
  if (isTransferOpen) {
    return (
      <TransferEditor
        cards={cards}
        initialFromId={activeCardObject?.id}
        onBack={() => setIsTransferOpen(false)}
        onSuccess={() => {
          setIsTransferOpen(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Wallet"
          actions={[
            {
              icon: (
                <HugeiconsIcon
                  icon={ArrowDataTransferHorizontalIcon}
                  size={18}
                />
              ),
              label: "Add Card",
              onPress: openTransferPage,
            },
            {
              icon: <HugeiconsIcon icon={CreditCardAddIcon} size={18} />,
              label: "Add Card",
              onPress: openNewCardEditor,
            },
          ]}
        />
      </div>

      <div className="px-4 pt-4 space-y-5 pt-[64px]">
        {/* CAROUSEL KARTU (SWIPE) */}
        <section className="relative flex flex-col items-center">
          <div className="relative w-full">
            <div ref={frameRef} className="w-full overflow-hidden py-4">
              {loading ? (
                <div
                  style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  className="mx-auto animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-900"
                />
              ) : cardsCount > 0 ? (
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  style={{ x: trackX, touchAction: "pan-y" }}
                  drag="x"
                  dragConstraints={{
                    left: -(cardsCount - 1) * slideWidth,
                    right: 0,
                  }}
                  dragElastic={0.12}
                  dragMomentum={false}
                  onDragStart={() => {
                    isDraggingRef.current = true;
                  }}
                  onDragEnd={handleDragEnd}
                >
                  {cards.map((card, i) => (
                    <div
                      key={card.id}
                      className="flex w-full shrink-0 justify-center"
                    >
                      {/* Hanya kartu aktif dan tetangganya yang dirender */}
                      {Math.abs(i - activeCardIndex) <= 1 && (
                        <CardItem
                          card={card}
                          onClick={() => {
                            if (isDraggingRef.current) return;
                            if (i !== activeCardIndex) return;
                            openEditCardEditor(card);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div
                  style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  className="mx-auto flex items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-400 dark:border-neutral-800 dark:text-neutral-600"
                >
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
            onClick={openNewCardEditor}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 py-3.5 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all text-gray-600 dark:text-gray-200"
          >
            <HugeiconsIcon icon={CreditCardAddIcon} size={15} />
            Tambah Kartu
          </button>

          <button
            onClick={openTransferPage}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-3.5 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95 transition-all"
          >
            <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={15} />
            Kirim Transfer
          </button>
        </div>

        {/* Transfer History */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
              Transfer History
            </h3>

            {activeCardObject && (
              <div className="flex bg-neutral-200 dark:bg-neutral-900 border border-neutral-300/30 dark:border-neutral-800 p-0.5 rounded-full text-[10px] w-fit self-end font-semibold">
                <button
                  onClick={() => setTransferFilter("all")}
                  className={`px-3 py-1 rounded-full active:scale-95 transition-all ${
                    transferFilter === "all"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTransferFilter("current")}
                  className={`px-3 py-1 rounded-full active:scale-95 transition-all max-w-[120px] truncate ${
                    transferFilter === "current"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Kartu Ini
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="w-full h-[64px] rounded-2xl bg-neutral-200 dark:bg-neutral-900 animate-pulse" />
              <div className="w-full h-[64px] rounded-2xl bg-neutral-200 dark:bg-neutral-900 animate-pulse border border-gray-200/50 dark:border-white/5" />
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
    </div>
  );
}
