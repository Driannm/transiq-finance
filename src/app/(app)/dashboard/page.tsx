"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { QuickAddGrid } from "@/components/Dashboard/QuickActions";
import { CardList } from "@/components/Shared/CardList";
import Link from "next/link";
import {
  ArrowDataTransferDiagonalIcon,
  Add01Icon,
  SparklesIcon,
  TrendingUp,
} from "@hugeicons/core-free-icons";
import {
  quickActions,
  transactions,
  upcomingBills,
  savingGoals,
  spendingCategories,
  navbarActions,
} from "@/lib/data/dashboard";
import { useMemo } from "react";

// ================= HELPERS =================

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function urgencyColor(urgency: string) {
  if (urgency === "high")
    return { text: "text-red-500", badge: "bg-red-50 text-red-600" };
  if (urgency === "medium")
    return { text: "text-amber-500", badge: "bg-amber-50 text-amber-600" };
  return { text: "text-blue-500", badge: "bg-blue-50 text-blue-600" };
}

// Progress ring untuk Saving Goal
function SavingGoalRing({ percentage, color }: { percentage: number; color: string }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#F1F1F1" strokeWidth="4" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-gray-700 font-mono">
        {percentage}%
      </span>
    </div>
  );
}

// Spending Breakdown donut
function SpendingBreakdownCard() {
  const total = spendingCategories.reduce((s, c) => s + c.percentage, 0);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const segments = useMemo(() => {
    return spendingCategories.reduce((acc, cat, index) => {
      const prevFraction = acc.reduce((sum, s) => sum + s.fraction, 0);
      const fraction = cat.percentage / total;
  
      acc.push({
        ...cat,
        fraction,
        dasharray: circumference,
        dashoffset: circumference - fraction * circumference,
        rotation: prevFraction * 360 - 90,
      });
  
      return acc;
    }, [] as any[]);
  }, [spendingCategories, total, circumference]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4">
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0 w-[80px] h-[80px]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="40" cy="40" r={r}
                fill="none" stroke={seg.color} strokeWidth="12"
                strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset}
                strokeLinecap="butt" transform={`rotate(${seg.rotation} 40 40)`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] text-gray-400 leading-none">Total</span>
            <span className="text-[11px] font-semibold text-gray-700 leading-tight mt-0.5 font-mono">
              970rb
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {spendingCategories.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-600">{cat.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 font-mono">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navbarIcons = navbarActions.map((a) => ({
    icon: <HugeiconsIcon icon={a.iconName} size={15} />,
    label: a.label,
    onPress: a.onPress,
  }));

  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      <IslandNavbar title="Dashboard" initials="JJ" actions={navbarIcons} />

      {/* Balance Card */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1A3FA8] to-[#0C1A5A] p-5 shadow-xl shadow-blue-900/30">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.03] blur-3xl" />
          <div className="relative z-10 flex items-center justify-between mb-6">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
              <circle cx="14" cy="12" r="11" fill="white" fillOpacity="0.9" />
              <circle cx="26" cy="12" r="11" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <p className="relative z-10 text-xl font-mono tracking-[0.3em] text-white/50 mb-4">
            •••• •••• •••• 3456
          </p>
          <div className="relative z-10 mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">
              Available Balance
            </p>
            <p className="mt-1 text-[36px] font-mono font-bold leading-none tracking-tight text-white">
              IDR 7.820.000
              <span className="text-xl font-semibold opacity-80">.00</span>
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

      {/* AI Insights */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-md font-semibold text-gray-800">AI Insights</span>
          <span className="text-sm font-medium text-blue-600">See All</span>
        </div>
        <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <HugeiconsIcon icon={SparklesIcon} size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Spending is down</p>
            <p className="text-xs text-gray-400">Down 12% from last week</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <HugeiconsIcon icon={TrendingUp} size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Investment Opportunity</p>
            <p className="text-xs text-gray-400">Tech ETFs trending up</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-md font-semibold text-gray-900">Quick Actions</span>
        </div>
        <QuickAddGrid items={quickActions} />
      </div>

      {/* Upcoming Bills */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold tracking-tight text-gray-900">Upcoming Bills</h3>
            <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
              1 urgent
            </span>
          </div>
          <Link href="/bills" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            See All
          </Link>
        </div>
        <CardList
          items={upcomingBills}
          keyExtractor={(bill) => bill.id}
          renderItem={(bill) => {
            const colors = urgencyColor(bill.urgency);
            return {
              left: (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bill.bg}`}>
                    <HugeiconsIcon icon={bill.icon} size={16} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{bill.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Due in {bill.dueIn} days</p>
                  </div>
                </>
              ),
              right: (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold font-mono ${colors.text}`}>
                    IDR {formatIDR(bill.amount)}
                  </span>
                </div>
              ),
            };
          }}
        />
      </div>

      {/* Saving Goals */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h3 className="text-md font-semibold tracking-tight text-gray-900">Saving Goals</h3>
          <Link href="/goals" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            See All
          </Link>
        </div>
        <CardList
          items={savingGoals}
          keyExtractor={(goal) => goal.id}
          renderItem={(goal) => {
            const percentage = Math.round((goal.saved / goal.target) * 100);
            return {
              left: (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${goal.bg}`}>
                    <HugeiconsIcon icon={goal.icon} size={16} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{goal.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      IDR {formatIDR(goal.saved)} <span className="text-gray-300">/</span>{" "}
                      {formatIDR(goal.target)}
                    </p>
                  </div>
                </>
              ),
              right: <SavingGoalRing percentage={percentage} color={goal.color} />,
            };
          }}
        />
      </div>

      {/* Spending Breakdown */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h3 className="text-md font-semibold tracking-tight text-gray-900">Spending Breakdown</h3>
          <span className="text-xs text-gray-400">This month</span>
        </div>
        <SpendingBreakdownCard />
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-md font-semibold tracking-tight text-gray-900">Recent Transactions</h3>
          <Link href="/transactions" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            See All
          </Link>
        </div>
        <CardList
          items={transactions}
          keyExtractor={(tx) => tx.id}
          renderItem={(tx) => {
            return {
              left: (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.bg}`}>
                    <HugeiconsIcon icon={tx.icon} size={16} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.category} · {tx.time}
                    </p>
                  </div>
                </>
              ),
              right: (
                <span
                  className={`text-sm font-semibold font-mono ${
                    tx.type === "expense" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}IDR {tx.amount.toFixed(3)}
                </span>
              ),
            };
          }}
        />
      </div>
    </div>
  );
}