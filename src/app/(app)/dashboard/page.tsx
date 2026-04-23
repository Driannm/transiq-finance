"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar, NavbarAction } from "@/components/Layout/MobileHeader";
import { QuickAddGrid } from "@/components/Dashboard/QuickActions";

import {
  SentIcon,
  Invoice02Icon,
  TrendingUp,
  CreditCardIcon,
  ArrowDataTransferDiagonalIcon,
  Add01Icon,
  SparklesIcon,
  ShoppingBag01Icon,
  Coffee01Icon,
  Car01Icon,
  MoneyAdd01Icon,
  MoneySend01Icon,
  MoneyReceive01Icon,
  MoneySendSquareIcon,
  MoneyReceiveSquareIcon,
  Search01Icon,
  Setting07Icon,
  Download04Icon,
  FilterHorizontalIcon,
} from "@hugeicons/core-free-icons";

// ================= DATA =================

const quickActions = [
  {
    label: "Income",
    icon: MoneyReceiveSquareIcon,
    path: "/income",
    iconClassName: "text-green-500",
    containerClassName: "bg-green-50",
  },
  {
    label: "Expenses",
    icon: MoneySendSquareIcon,
    path: "/expenses",
    iconClassName: "text-red-500",
    containerClassName: "bg-red-50",
  },
  {
    label: "Debts",
    icon: MoneySend01Icon,
    onClick: () => console.log("Open debt modal"),
    iconClassName: "text-orange-500",
    containerClassName: "bg-orange-50",
  },
  {
    label: "Loans",
    icon: MoneyReceive01Icon,
    path: "/loans",
    iconClassName: "text-teal-500",
    containerClassName: "bg-teal-50",
  },
];

const actions: NavbarAction[] = [
  {
    icon: <HugeiconsIcon icon={Setting07Icon} size={15} />,
    label: "Setting",
    onPress: () => console.log("Setting clicked"),
  },
];

const transactions = [
  {
    id: 1,
    name: "Apple Store",
    category: "Household Goods",
    time: "10:23 AM",
    type: "expense",
    amount: 129.0,
    icon: ShoppingBag01Icon,
    bg: "bg-red-100",
  },
  {
    id: 2,
    name: "Starbucks Coffee",
    category: "Food & Drinks",
    time: "10:24 AM",
    type: "expense",
    amount: 12.5,
    icon: Coffee01Icon,
    bg: "bg-red-100",
  },
  {
    id: 3,
    name: "Uber",
    category: "Transport",
    time: "08:45 AM",
    type: "expense",
    amount: 24.8,
    icon: Car01Icon,
    bg: "bg-red-100",
  },
  {
    id: 4,
    name: "Payroll",
    category: "Salary",
    time: "05:00 AM",
    type: "income",
    amount: 4250.0,
    icon: MoneyAdd01Icon,
    bg: "bg-green-100",
  },
  {
    id: 5,
    name: "Apple Store",
    category: "Electronics",
    time: "10:23 AM",
    type: "expense",
    amount: 129.0,
    icon: ShoppingBag01Icon,
    bg: "bg-red-100",
  },
];

// ================= PAGE =================

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      {/* Header */}
      <IslandNavbar title="Dashboard" initials="JJ" actions={actions} />
      {/* Balance Card */}
      <div className="px-4 pt-4">
        <div
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: "#1A3FA8" }}
        >
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/60">
                Total Balance
              </p>
              <p className="mt-1.5 text-[42px] font-extrabold leading-none tracking-tight text-white">
                $42,853
                <span className="text-2xl font-semibold opacity-85">.00</span>
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex gap-2.5">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-blue-700">
              <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={17} />
              Transfer
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/[0.12] py-3.5 text-sm font-bold text-white">
              <HugeiconsIcon icon={Add01Icon} size={17} />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-base font-bold text-gray-900">AI Insights</span>
          <span className="text-sm font-medium text-blue-600">See All</span>
        </div>
        <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              className="text-green-500"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Spending is down
            </p>
            <p className="text-xs text-gray-400">Down 12% from last week</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <HugeiconsIcon
              icon={TrendingUp}
              size={18}
              className="text-blue-500"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Investment Opportunity
            </p>
            <p className="text-xs text-gray-400">Tech ETFs trending up</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-base font-bold text-gray-900">
            Quick Actions
          </span>
        </div>

        <QuickAddGrid items={quickActions} />
      </div>

      {/* Transactions */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-base font-bold text-gray-900">
            Recent Transactions
          </span>
          <span className="text-sm font-medium text-blue-600">See All</span>
        </div>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white rounded-2xl p-3 flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.bg}`}
              >
                <HugeiconsIcon
                  icon={tx.icon}
                  size={20}
                  className="text-gray-700"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{tx.name}</p>
                <p className="text-xs text-gray-400">
                  {tx.category} · {tx.time}
                </p>
              </div>
            </div>
            <p
              className={`text-sm font-bold ${
                tx.type === "expense" ? "text-red-500" : "text-green-500"
              }`}
            >
              {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
