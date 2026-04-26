/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { QuickAddGrid } from "@/components/Dashboard/QuickActions";
import { CardList } from "@/components/Shared/CardList";
import { SectionBlock, EmptyState } from "@/components/Shared/SectionBlock";
import Link from "next/link";
import {
  ArrowDataTransferDiagonalIcon,
  Add01Icon,
  SparklesIcon,
  TrendingUp,
  Invoice02Icon,
  Beach02Icon,
  MoneyReceive01Icon,
  PieChartIcon,
} from "@hugeicons/core-free-icons";
import {
  quickActions,
  transactions,
  upcomingBills,
  savingGoals,
  spendingCategories,
} from "@/lib/data/dashboard";
import { useMemo } from "react";

// ================= HELPERS =================

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function urgencyColor(urgency: string) {
  if (urgency === "high")
    return { text: "text-red-500", badge: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" };
  if (urgency === "medium")
    return { text: "text-amber-500", badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" };
  return { text: "text-blue-500", badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" };
}

function SavingGoalRing({ percentage, color }: { percentage: number; color: string }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4"
          className="text-gray-200 dark:text-gray-700" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 20 20)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700 dark:text-gray-300 font-mono">
        {percentage}%
      </span>
    </div>
  );
}

function SpendingBreakdownCard() {
  const total = spendingCategories.reduce((s, c) => s + c.percentage, 0);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const segments = useMemo(() => {
    return spendingCategories.reduce((acc, cat) => {
      const prevFraction = acc.reduce((sum: number, s: any) => sum + s.fraction, 0);
      const fraction = cat.percentage / total;
      acc.push({ ...cat, fraction, dasharray: circumference,
        dashoffset: circumference - fraction * circumference,
        rotation: prevFraction * 360 - 90 });
      return acc;
    }, [] as any[]);
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none p-4">
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0 w-[80px] h-[80px]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {segments.map((seg: any, i: number) => (
              <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={seg.color}
                strokeWidth="12" strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset}
                strokeLinecap="butt" transform={`rotate(${seg.rotation} 40 40)`} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">Total</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight mt-0.5 font-mono">970rb</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {spendingCategories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{cat.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-mono">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= PAGE =================

export default function DashboardPage() {
  const urgentBillsCount = upcomingBills.filter((b) => b.urgency === "high").length;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 pb-24 font-sans">
      <IslandNavbar title="Dashboard"/>

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
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">Available Balance</p>
            <p className="mt-1 text-[36px] font-mono font-bold leading-none tracking-tight text-white">
              IDR 7.820.000<span className="text-xl font-semibold opacity-80">.00</span>
            </p>
          </div>
          <div className="relative z-10 flex gap-2.5">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-[#1A3FA8] shadow active:scale-95 transition-transform">
              <HugeiconsIcon icon={ArrowDataTransferDiagonalIcon} size={16} />
              Transfer
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white backdrop-blur-sm active:scale-95 transition-transform">
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* ---- AI Insights ---- */}
      {/* <SectionBlock
        title="AI Insights"
        action={{ type: "button", label: "See All", onPress: () => {} }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex gap-3 shadow-sm dark:shadow-none">
          <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <HugeiconsIcon icon={SparklesIcon} size={18} className="text-green-500 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spending is down</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Down 12% from last week</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex gap-3 shadow-sm dark:shadow-none">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <HugeiconsIcon icon={TrendingUp} size={18} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Investment Opportunity</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Tech ETFs trending up</p>
          </div>
        </div>
      </SectionBlock> */}

      {/* ---- Quick Actions ---- */}
      <SectionBlock title="Quick Access">
        <QuickAddGrid items={quickActions} />
      </SectionBlock>

      {/* ---- Upcoming Bills ---- */}
      <SectionBlock
        title="Upcoming Bills"
        badge={urgentBillsCount > 0 ? { label: `${urgentBillsCount} urgent`, variant: "red" } : undefined}
        action={{ type: "link", label: "See All", href: "/bills" }}
      >
        <CardList
          items={upcomingBills}
          keyExtractor={(bill) => bill.id}
          emptyState={
            <EmptyState
              icon={<HugeiconsIcon icon={Invoice02Icon} size={32} className="text-gray-300 dark:text-gray-600" />}
              title="No upcoming bills"
              description="You're all caught up! No bills due soon."
            />
          }
          renderItem={(bill) => {
            const colors = urgencyColor(bill.urgency);
            return {
              left: (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bill.bg} dark:bg-opacity-20`}>
                    <HugeiconsIcon icon={bill.icon} size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{bill.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Due in {bill.dueIn} days</p>
                  </div>
                </>
              ),
              right: (
                <span className={`text-sm font-semibold font-mono ${colors.text}`}>
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
        action={{ type: "link", label: "See All", href: "/goals" }}
      >
        <CardList
          items={savingGoals}
          keyExtractor={(goal) => goal.id}
          emptyState={
            <EmptyState
              icon={<HugeiconsIcon icon={Beach02Icon} size={32} className="text-gray-300 dark:text-gray-600" />}
              title="No saving goals yet"
              description="Start saving for your dreams. Create your first goal."
            />
          }
          renderItem={(goal) => {
            const percentage = Math.round((goal.saved / goal.target) * 100);
            return {
              left: (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${goal.bg} dark:bg-opacity-20`}>
                    <HugeiconsIcon icon={goal.icon} size={22} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{goal.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                      IDR {formatIDR(goal.saved)} <span className="text-gray-300 dark:text-gray-600">/</span> {formatIDR(goal.target)}
                    </p>
                  </div>
                </>
              ),
              right: <SavingGoalRing percentage={percentage} color={goal.color} />,
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
          <EmptyState
            icon={<HugeiconsIcon icon={PieChartIcon} size={32} className="text-gray-300 dark:text-gray-600" />}
            title="No spending data"
            description="Add your expenses to see a breakdown by category."
          />
        ) : (
          <SpendingBreakdownCard />
        )}
      </SectionBlock>

      {/* ---- Recent Transactions ---- */}
      <SectionBlock
        title="Recent Transactions"
        action={{ type: "link", label: "See All", href: "/transactions" }}
      >
        <CardList
          items={transactions}
          keyExtractor={(tx) => tx.id}
          emptyState={
            <EmptyState
              icon={<HugeiconsIcon icon={MoneyReceive01Icon} size={32} className="text-gray-300 dark:text-gray-600" />}
              title="No recent transactions"
              description="Your transactions will appear here once you start recording."
            />
          }
          renderItem={(tx) => ({
            left: (
              <>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.bg} dark:bg-opacity-20`}>
                  <HugeiconsIcon icon={tx.icon} size={22} className="text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tx.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{tx.category} · {tx.time}</p>
                </div>
              </>
            ),
            right: (
              <span className={`text-sm font-semibold font-mono ${
                tx.type === "expense" ? "text-red-500" : "text-green-500"
              }`}>
                {tx.type === "expense" ? "-" : "+"}IDR {tx.amount.toFixed(3)}
              </span>
            ),
          })}
        />
      </SectionBlock>
    </div>
  );
}