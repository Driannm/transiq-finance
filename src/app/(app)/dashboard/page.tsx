/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/immutability */
"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { BalanceHeader } from "@/components/Shared/BalanceHeader";
import { QuickAddGrid } from "@/components/Dashboard/QuickActions";
import { CardList } from "@/components/Shared/CardList";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { useConfirm } from "@/hooks/UseConfirm";
import { signOut } from "next-auth/react";

import useSWR from "swr";

// ✅ Import dummy data
import { quickActions, spendingCategories } from "@/lib/data/dashboard";

// ✅ Import icon mapper & utilities
import { getCategoryIcon } from "@/lib/iconMapping";
import { useRecentTransactions } from "@/hooks/UseRecentTransactions";

// ✅ Import icons
import {
  ArrowDataTransferDiagonalIcon,
  Add01Icon,
  Invoice02Icon,
  Beach02Icon,
  MoneyReceive01Icon,
  PieChartIcon,
  Logout03Icon,
  AlertCircleIcon,
  HomeIcon,
  Analytics01Icon,
  Wallet02Icon,
  AddMoneyCircleIcon,
  MoneySavingJarIcon,
  Car01Icon,
  Home01Icon,
  CircleArrowDown02Icon,
  CircleArrowUp02Icon,
  CircleArrowUpDownIcon,
} from "@hugeicons/core-free-icons";

// ─── Helpers ────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(amount));
}

function urgencyColor(urgency: string) {
  if (urgency === "high")
    return {
      text: "text-red-500",
      badge: "bg-red-50 dark:bg-red-900/30 text-red-600",
    };
  if (urgency === "medium")
    return {
      text: "text-amber-500",
      badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-600",
    };
  return {
    text: "text-blue-500",
    badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-600",
  };
}

// ─── Sub-Components ─────────────────────────────────────────

function SavingGoalRing({
  percentage,
  color,
}: {
  percentage: number;
  color: string;
}) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700 dark:text-gray-300 font-mono">
        {percentage}%
      </span>
    </div>
  );
}

function SpendingBreakdownCard() {
  const totalAmount = spendingCategories.reduce((s, c) => s + c.amount, 0);
  const totalPercent = spendingCategories.reduce((s, c) => s + c.percentage, 0);
  const r = 30;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    let currentRotation = -90;
    return spendingCategories.map((cat) => {
      const fraction = cat.percentage / totalPercent;
      const res = {
        ...cat,
        dasharray: circumference,
        dashoffset: circumference - fraction * circumference,
        rotation: currentRotation,
      };
      currentRotation += fraction * 360;
      return res;
    });
  }, [totalPercent, circumference]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0 w-[80px] h-[80px]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
                strokeLinecap="butt"
                transform={`rotate(${seg.rotation} 40 40)`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] text-gray-400 leading-none">Total</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-0.5 font-mono">
              {formatIDR(totalAmount)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {spendingCategories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {cat.label}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-mono">
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

const CATEGORY_META = {
  utilities: {
    label: "Utilitas",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  subscription: {
    label: "Langganan",
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  rent: {
    label: "Sewa Rumah",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  insurance: {
    label: "Asuransi",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  internet: {
    label: "Internet",
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
  },
  other: {
    label: "Lainnya",
    bg: "bg-slate-100 dark:bg-slate-950/40",
    text: "text-slate-600 dark:text-slate-400",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const { data, error, isLoading, mutate } = useRecentTransactions();
  const transactions = data?.transactions || [];

  const { data: billsData, isLoading: billsLoading } = useSWR("/api/bills");
  const { data: savingsData, isLoading: savingsLoading } =
    useSWR("/api/savings");

  const upcomingBills = useMemo(() => {
    const rawBills = billsData?.bills || [];
    return rawBills
      .filter((b: any) => b.status === "pending" || b.status === "overdue")
      .map((bill: any) => {
        const dueIn = Math.ceil(
          (new Date(bill.dueDate).getTime() - new Date().setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24),
        );
        const meta =
          CATEGORY_META[bill.category as keyof typeof CATEGORY_META] ||
          CATEGORY_META.other;
        return {
          id: bill.id,
          name: bill.name,
          icon: getCategoryIcon(bill.category),
          dueIn,
          amount: bill.amount,
          urgency:
            bill.status === "overdue" || dueIn <= 3
              ? "high"
              : dueIn <= 7
                ? "medium"
                : "low",
          bg: meta.bg,
        };
      })
      .slice(0, 3);
  }, [billsData]);

  const savingGoals = useMemo(() => {
    const rawSavings = savingsData?.savings || [];
    return rawSavings
      .map((goal: any, index: number) => {
        const colors = ["#1D9E75", "#378ADD", "#EF9F27", "#8B5CF6", "#EC4899"];
        const bgs = [
          "bg-emerald-50 dark:bg-emerald-950/30",
          "bg-blue-50 dark:bg-blue-950/30",
          "bg-amber-50 dark:bg-amber-950/30",
          "bg-purple-50 dark:bg-purple-950/30",
          "bg-pink-50 dark:bg-pink-950/30",
        ];
        const icons = [MoneySavingJarIcon, Beach02Icon, Home01Icon, Car01Icon];
        return {
          id: goal.id,
          name: goal.name,
          icon: icons[index % icons.length] || MoneySavingJarIcon,
          saved: goal.savedAmount,
          target: goal.targetAmount,
          color: colors[index % colors.length],
          bg: bgs[index % bgs.length],
        };
      })
      .slice(0, 3);
  }, [savingsData]);

  const handleLogout = useCallback(() => {
    confirm({
      title: "Keluar dari akun?",
      description: "Sesi Anda akan berakhir dan Anda perlu login kembali.",
      confirmLabel: "Ya, Keluar",
      variant: "danger",
      icon: <HugeiconsIcon icon={Logout03Icon} size={20} />,
      onConfirm: () => signOut({ callbackUrl: "/" }),
    });
  }, [confirm]);

  const urgentBillsCount = useMemo(() => {
    return upcomingBills.filter((b: any) => b.urgency === "high").length;
  }, [upcomingBills]);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <IslandNavbar
          title="Dashboard"
          actions={[
            {
              icon: <HugeiconsIcon icon={Logout03Icon} size={20} />,
              onPress: handleLogout,
              label: "Quick Log Out",
            },
          ]}
        />
      </div>

      <div className="px-4 pt-4 space-y-5 pt-[64px]">
        {/* ---- Balance Card ---- */}
        <BalanceHeader
          label="Total pengeluaran"
          amount={20499399}
          variant="yellow"
          isLoading={isLoading}
          badges={[
            /* Badge Hemat */
            <div
              key="saved"
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-red-200">
                <HugeiconsIcon icon={AddMoneyCircleIcon} size={16} />
              </span>
              <span className="text-xs font-mono font-medium text-white">
                230.000
              </span>
            </div>,
            /* Badge Persentase */
            <div
              key="percent"
              className="flex items-center gap-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-3 py-1.5 rounded-full text-green-300"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span className="text-xs font-semibold">12.5%</span>
            </div>,
          ]}
        />
      </div>

      {/* ---- Quick Actions ---- */}
      <SectionBlock title="Quick Access">
        <QuickAddGrid items={quickActions} />
      </SectionBlock>

      {/* ---- Upcoming Bills ---- */}
      <SectionBlock
        title="Upcoming Bills"
        badge={
          urgentBillsCount > 0
            ? { label: `${urgentBillsCount} urgent`, variant: "red" }
            : undefined
        }
        action={{ type: "link", label: "See All", href: "/bills" }}
      >
        <CardList
          items={upcomingBills}
          keyExtractor={(bill) => bill.id}
          isLoading={billsLoading}
          skeleton={{
            fields: ["icon", "title", "subtitle", "amount"],
            count: 3,
          }}
          emptyState={{
            icon: (
              <HugeiconsIcon
                icon={Invoice02Icon}
                size={32}
                className="text-gray-300 dark:text-gray-600"
              />
            ),
            title: "No upcoming bills",
            description: "You're all caught up! No bills due soon.",
          }}
          renderItem={(bill) => {
            const colors = urgencyColor(bill.urgency);
            return {
              left: (
                <>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${bill.bg} dark:bg-opacity-20`}
                  >
                    <HugeiconsIcon
                      icon={bill.icon}
                      size={22}
                      className="text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {bill.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                      Due in {bill.dueIn} days
                    </p>
                  </div>
                </>
              ),
              right: (
                <span
                  className={`text-sm font-semibold font-mono ${colors.text}`}
                >
                  IDR {formatIDR(bill.amount)}
                </span>
              ),
            };
          }}
        />
      </SectionBlock>

      {/* ---- Saving Goals ---- */}
      <SectionBlock
        title="Saving Goals"
        action={{
          type: "button",
          label: "Add Savings",
          onPress: () => router.push("/savings"),
        }}
      >
        <CardList
          items={savingGoals}
          keyExtractor={(goal) => goal.id}
          isLoading={savingsLoading}
          skeleton={{
            fields: ["icon", "title", "subtitle", "amount"],
            count: 3,
          }}
          emptyState={{
            icon: (
              <HugeiconsIcon
                icon={Beach02Icon}
                size={32}
                className="text-gray-300 dark:text-gray-600"
              />
            ),
            title: "No saving goals yet",
            description:
              "Start saving for your dreams. Create your first goal.",
          }}
          renderItem={(goal) => {
            const percentage = Math.min(
              100,
              Math.round((goal.saved / goal.target) * 100),
            );
            return {
              left: (
                <>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${goal.bg} dark:bg-opacity-20`}
                  >
                    <HugeiconsIcon
                      icon={goal.icon}
                      size={22}
                      className="text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {goal.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                      IDR {formatIDR(goal.saved)} / {formatIDR(goal.target)}
                    </p>
                  </div>
                </>
              ),
              right: (
                <SavingGoalRing percentage={percentage} color={goal.color} />
              ),
            };
          }}
        />
      </SectionBlock>

      {/* ---- Spending Breakdown ---- */}
      <SectionBlock
        title="Spending Breakdown"
        action={{ type: "text", label: "This month" }}
      >
        {spendingCategories.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-800">
            <HugeiconsIcon
              icon={PieChartIcon}
              size={32}
              className="mx-auto text-gray-300 mb-2"
            />
            <p className="text-sm text-gray-500">No spending data</p>
          </div>
        ) : (
          <SpendingBreakdownCard />
        )}
      </SectionBlock>

      {/* ---- Recent Transactions (REAL DATA) ---- */}
      <SectionBlock title="Recent Transactions">
        <CardList
          items={transactions}
          keyExtractor={(tx) => tx.id}
          isLoading={isLoading}
          skeleton={{
            fields: ["icon", "title", "subtitle", "amount"],
            count: 3,
          }}
          emptyState={
            error
              ? {
                  icon: (
                    <HugeiconsIcon
                      icon={MoneyReceive01Icon}
                      size={32}
                      className="text-gray-300 dark:text-gray-600"
                    />
                  ),
                  title: "Tidak ada transaksi",
                  description: "Belum ada transaksi dalam 2 hari terakhir.",
                  actions: [
                    {
                      id: "retry",
                      label: "Coba Lagi",
                      onPress: () => mutate(),
                      variant: "primary",
                    },
                  ],
                }
              : {
                  icon: (
                    <HugeiconsIcon
                      icon={MoneyReceive01Icon}
                      size={32}
                      className="text-gray-300 dark:text-gray-600"
                    />
                  ),
                  title: "No recent transactions",
                  description:
                    "Your transactions will appear here once you start recording.",
                }
          }
          renderItem={(tx) => {
            let IconComponent = CircleArrowUp02Icon;
            if (tx.originalType === "INCOME" || tx.originalType === "DEBT") {
              IconComponent = CircleArrowDown02Icon;
            } else if (tx.originalType === "TRANSFER") {
              IconComponent = CircleArrowUpDownIcon;
            }

            const typeLabelMap: Record<string, string> = {
              EXPENSE: "Pengeluaran",
              INCOME: "Pemasukan",
              DEBT: "Hutang",
              LOAN: "Pinjaman",
              TRANSFER: "Transfer",
            };
            const txLabel = typeLabelMap[tx.originalType] || tx.originalType;

            const bgMap: Record<string, string> = {
              expense: "bg-red-200",
              income: "bg-green-200",
              debts: "bg-orange-200",
            };
            return {
              left: (
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                      bgMap[tx.type] || "bg-gray-200"
                    } dark:bg-opacity-20`}
                  >
                    <HugeiconsIcon
                      icon={IconComponent}
                      size={22}
                      className="text-gray-700"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {tx.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {txLabel} - {tx.category}
                    </p>
                  </div>
                </div>
              ),
              right: (
                <div className="flex flex-col items-end justify-center">
                  <span
                    className={`flex items-baseline gap-[3px] font-semibold ${
                      tx.type === "expense" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    <span className="text-sm">
                      {tx.type === "expense" ? "-" : "+"}
                    </span>

                    <span className="font-mono text-sm">
                      {formatIDR(tx.amount)}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                    {tx.time}
                  </span>
                </div>
              ),
            };
          }}
        />
      </SectionBlock>
    </div>
  );
}
