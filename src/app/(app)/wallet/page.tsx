"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { CardList } from "@/components/Shared/CardList";
import Link from "next/link";
import {
  Add01Icon,
  ArrowDataTransferDiagonalIcon,
  Invoice02Icon,
  Settings01Icon,
  UserIcon,
  BankIcon,
  MoneySend02Icon,
  MoneyReceive02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

// ─── Data Dummy ──────────────────────────────────────────────────────────────

interface CardData {
  id: number;
  name: string;
  type: "debit" | "credit";
  bank: string;
  lastFour: string;
  balance: number;
  color: string;
  colorEnd?: string;
  icon: IconSvgElement;
}

const myCards: CardData[] = [
  {
    id: 1,
    name: "Spending Card",
    type: "debit",
    bank: "Transiq",
    lastFour: "3456",
    balance: 5_200_000,
    color: "#1A3FA8",
    colorEnd: "#0C1A5A",
    icon: Invoice02Icon,
  },
  {
    id: 2,
    name: "Savings Card",
    type: "debit",
    bank: "Transiq",
    lastFour: "7890",
    balance: 2_640_000,
    color: "#0F766E",
    colorEnd: "#115E59",
    icon: Settings01Icon,
  },
];

// Data History Transfer
const transferHistory = [
  {
    id: 1,
    targetName: "Alex Rivera",
    bankName: "BCA • 8832",
    time: "Today, 14:20",
    amount: 1500000,
    type: "send", // Kirim uang
    icon: UserIcon,
    bg: "bg-orange-100 dark:bg-orange-950/30",
    iconColor: "text-orange-600",
  },
  {
    id: 2,
    targetName: "Company XYZ",
    bankName: "Transiq Payroll",
    time: "Yesterday, 09:00",
    amount: 8500000,
    type: "receive", // Terima uang
    icon: BankIcon,
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600",
  },
  {
    id: 3,
    targetName: "Sarah Jenkins",
    bankName: "Mandiri • 1029",
    time: "Mar 14, 18:45",
    amount: 250000,
    type: "send",
    icon: UserIcon,
    bg: "bg-blue-100 dark:bg-blue-950/30",
    iconColor: "text-blue-600",
  },
  {
    id: 4,
    targetName: "Indra Wijaya",
    bankName: "GoPay • 0812",
    time: "Mar 12, 12:10",
    amount: 50000,
    type: "send",
    icon: UserIcon,
    bg: "bg-purple-100 dark:bg-purple-950/30",
    iconColor: "text-purple-600",
  },
];

// ─── Helper format ───────────────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// ─── Komponen Kartu ─────────────────────────────────────────────────────────

function CardItem({ card }: { card: CardData }) {
  const isNegative = card.balance < 0;
  return (
    <div
      className="rounded-2xl p-5 text-white shadow-lg overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${card.color}, ${card.colorEnd ?? card.color})`,
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="w-8 h-6 bg-yellow-300/80 rounded-[4px] flex items-center justify-center shadow-inner">
          <div className="w-3 h-3 rounded-full bg-yellow-600/30" />
        </div>
        <span className="text-xs font-semibold tracking-wider opacity-80">{card.bank}</span>
      </div>

      <p className="text-lg font-mono tracking-[0.2em] opacity-70 mb-1">
        •••• •••• •••• {card.lastFour}
      </p>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-60">Balance</p>
          <p className="text-2xl font-bold mt-0.5">
            {isNegative ? "-" : ""}IDR {formatIDR(card.balance)}
          </p>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md font-bold uppercase backdrop-blur-md">
          {card.type}
        </span>
      </div>
    </div>
  );
}

// ─── Halaman ─────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const totalBalance = myCards.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col pb-8">
      {/* Header */}
      <IslandNavbar
        title="Wallet"
        actions={[
          {
            icon: <HugeiconsIcon icon={Add01Icon} size={18} />,
            label: "Add Card",
            onPress: () => console.log("Add card"),
          },
        ]}
      />

      <div className="flex-1 px-4 pt-4 space-y-6">
        {/* Saldo total */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/[0.05]">
          <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">Total Balance</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            IDR {formatIDR(Math.abs(totalBalance))}
          </p>
        </div>

        {/* Daftar Kartu */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3 px-1">
            My Cards
          </h3>
          <div className="space-y-3">
            {myCards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        </section>

        {/* Tombol Manage & Transfer */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/[0.1] py-3.5 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm active:scale-95 transition">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
            Manage
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-600/20 active:scale-95 transition">
            <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={18} />
            Transfer
          </button>
        </div>

        {/* Transfer History (Ganti dari Card Transactions) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
              Transfer History
            </h3>
            <Link
              href="/history"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              See All
            </Link>
          </div>
          
          <CardList
            items={transferHistory}
            keyExtractor={(tr) => tr.id}
            renderItem={(tr) => ({
              left: (
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${tr.bg}`}>
                    <HugeiconsIcon icon={tr.icon} size={20} className={tr.iconColor} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">
                      {tr.targetName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-500 mt-1">
                      {tr.bankName} • {tr.time}
                    </p>
                  </div>
                </div>
              ),
              right: (
                <div className="text-right">
                  <p className={`text-[14px] font-bold ${
                    tr.type === "send" ? "text-gray-900 dark:text-white" : "text-emerald-500"
                  }`}>
                    {tr.type === "send" ? "-" : "+"} {formatIDR(tr.amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-600 mt-0.5 uppercase font-medium">
                    {tr.type === "send" ? "Outgoing" : "Incoming"}
                  </p>
                </div>
              ),
            })}
          />
        </section>
      </div>
    </div>
  );
}