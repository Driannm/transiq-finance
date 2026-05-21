/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { QuickAddGrid } from "@/components/Dashboard/QuickActions";
import { CardList } from "@/components/Shared/CardList";
import { SectionBlock } from "@/components/Shared/SectionBlock";
import { useConfirm } from "@/hooks/UseConfirm";
import { signOut } from "next-auth/react";

// ✅ Import dummy data
import {
  quickActions,
  upcomingBills,
  savingGoals,
  spendingCategories,
} from "@/lib/data/dashboard";

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
} from "@hugeicons/core-free-icons";
import { BottomNav, BottomNavItem } from "@/components/Layout/BottomNavbar";

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

export default function DashboardPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const { data, error, isLoading, mutate } = useRecentTransactions();
  const transactions = data?.transactions || [];

  const navItems: BottomNavItem[] = [
    { path: "/dashboard", label: "Home", icon: HomeIcon },
    { path: "/analytics", label: "Analytics", icon: Analytics01Icon },
    { path: "/wallet", label: "Wallet", icon: Wallet02Icon },
  ];

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

  const urgentBillsCount = upcomingBills.filter(
    (b) => b.urgency === "high"
  ).length;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24 font-sans">
      <div className="sticky top-0 z-50">
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

      {/* ---- Balance Card ---- */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1A3FA8] to-[#0C1A5A] p-5">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.03] blur-3xl" />
          <div className="relative z-10 flex items-center justify-between mb-6">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <circle cx="14" cy="12" r="11" fill="white" fillOpacity="0.9" />
              <circle cx="26" cy="12" r="11" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div className="relative z-10 mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">
              Available Balance
            </p>
            <p className="mt-1 text-[36px] font-mono font-bold leading-none tracking-tight text-white">
              IDR {formatIDR(7820000)}
              <span className="text-xl font-semibold opacity-80">.00</span>
            </p>
          </div>
          <div className="relative z-10 flex gap-2.5">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-[#1A3FA8] shadow active:scale-95 transition-transform">
              <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={16} />{" "}
              Transfer
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white backdrop-blur-sm active:scale-95 transition-transform">
              <HugeiconsIcon icon={Add01Icon} size={16} /> Add Funds
            </button>
          </div>
        </div>
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
              Math.round((goal.saved / goal.target) * 100)
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
            const IconComponent = getCategoryIcon(tx.category);
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
                      {tx.category} · {tx.time}
                    </p>
                  </div>
                </div>
              ),
              right: (
                <span
                  className={`text-sm font-semibold font-mono ${
                    tx.type === "expense" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}IDR {formatIDR(tx.amount)}
                </span>
              ),
            };
          }}
        />
      </SectionBlock>

      <BottomNav items={navItems} />
    </div>
  );
}
