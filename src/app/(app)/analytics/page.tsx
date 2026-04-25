/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download04Icon,
  FilterHorizontalIcon,
  Share01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Calendar02Icon,
  PieChartIcon,
  MoneyRemove01Icon,
  ChartAnalysisIcon,
  MoneyReceive01Icon,
  MoneyBag01Icon,
  Invoice02Icon,
  SquareArrowDown01Icon,
  SquareArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { IslandNavbar, NavbarAction } from "@/components/Layout/MobileHeader";
import { MetricCard } from "@/components/Analytics/MetricCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionBlock, EmptyState } from "@/components/Shared/SectionBlock";
import {
  type Period,
  dailyData,
  periodStats,
  breakdown,
  recentLargeTransactions,
} from "@/lib/data/analytics";

// ─── Navbar Actions ───────────────────────────────────────────────────────────

const actions: NavbarAction[] = [
  {
    icon: <HugeiconsIcon icon={FilterHorizontalIcon} size={18} />,
    label: "Filter",
    onPress: () => console.log("Filter clicked"),
  },
  {
    icon: <HugeiconsIcon icon={Share01Icon} size={18} />,
    label: "Share",
    onPress: () => console.log("Share clicked"),
  },
  {
    icon: <HugeiconsIcon icon={Download04Icon} size={18} />,
    label: "Export",
    onPress: () => console.log("Download clicked"),
  },
];

// ─── Chart Component ──────────────────────────────────────────────────────────

function ModernBarChart({ data }: { data: { label: string; value: number; prevValue: number }[] }) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.prevValue)));
  return (
    <div className="flex items-end justify-around gap-1 h-36 w-full mt-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1">
          <div className="relative w-full flex justify-center items-end" style={{ height: "120px" }}>
            <div
              className="w-6 rounded-t-md bg-blue-100 dark:bg-blue-900/40 absolute bottom-0"
              style={{ height: `${(item.prevValue / maxValue) * 100}%`, minHeight: 4 }}
            />
            <div
              className="w-5 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 absolute bottom-0 z-10"
              style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: 4 }}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("Month");

  const currentStats = periodStats[period];
  const changePercent =
    ((currentStats.totalSpent - currentStats.prevTotalSpent) / currentStats.prevTotalSpent) * 100;
  const isExpenseUp = changePercent > 0;
  const netCash = currentStats.income - currentStats.totalSpent;
  const savingsRate = (netCash / currentStats.income) * 100;
  const isEmpty = true;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <IslandNavbar title="Analytics" initials="JJ" actions={actions} />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="mb-6">
          <TabsList className="w-full bg-gray-200 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1 gap-1">
            {(["Week", "Month", "Year", "All"] as Period[]).map((p) => (
              <TabsTrigger
                key={p}
                value={p}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400 transition-all"
              >
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard
            label="Total Spent"
            icon={Calendar02Icon}
            value={`$${currentStats.totalSpent.toLocaleString()}`}
            valueColor="text-gray-800 dark:text-gray-100"
            isEmpty={isEmpty}
            emptyIcon={Invoice02Icon}
            emptyMessage="Start recording expenses"
            sub={
              !isEmpty && (
                <div className="flex items-center gap-1 mt-1">
                  {isExpenseUp ? (
                    <HugeiconsIcon icon={ArrowUp01Icon} size={12} className="text-red-500" />
                  ) : (
                    <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="text-green-500" />
                  )}
                  <span className={`text-xs font-semibold ${isExpenseUp ? "text-red-500" : "text-green-500"}`}>
                    {Math.abs(changePercent).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">vs prev.</span>
                </div>
              )
            }
          />
          <MetricCard
            label="Net Cash Flow"
            icon={netCash >= 0 ? SquareArrowUp01Icon : SquareArrowDown01Icon}
            value={`${netCash >= 0 ? "+" : "-"}$${Math.abs(netCash).toLocaleString()}`}
            valueColor={netCash >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}
            isEmpty={isEmpty}
            emptyIcon={SquareArrowUp01Icon}
            emptyMessage="No transactions yet"
            sub={
              !isEmpty && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Savings Rate</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
              )
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <MetricCard
            label="Income"
            icon={MoneyReceive01Icon}
            value={`$${currentStats.income.toLocaleString()}`}
            valueColor="text-green-600 dark:text-green-400"
            isEmpty={isEmpty}
            emptyIcon={MoneyReceive01Icon}
            emptyMessage="No income recorded"
            sub={null}
          />
          <MetricCard
            label="Budget"
            icon={MoneyBag01Icon}
            value={`$${currentStats.budget.toLocaleString()}`}
            valueColor="text-gray-800 dark:text-gray-100"
            isEmpty={isEmpty}
            emptyIcon={MoneyBag01Icon}
            emptyMessage="Set a budget to track"
            sub={
              !isEmpty && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {((currentStats.totalSpent / currentStats.budget) * 100).toFixed(0)}% used
                </div>
              )
            }
          />
        </div>

        {/* Spending Trend */}
        <SectionBlock title="Spending Trend" padded={false}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
            {dailyData[period].length > 0 && (
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-900/60" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Previous</span>
                </div>
              </div>
            )}
            {dailyData[period].length === 0 ? (
              <EmptyState
                variant="inline"
                icon={<HugeiconsIcon icon={ChartAnalysisIcon} size={30} className="text-gray-300 dark:text-gray-600" />}
                title="No spending trend yet"
                description="Your spending chart will appear once you start recording transactions."
              />
            ) : (
              <ModernBarChart data={dailyData[period]} />
            )}
          </div>
        </SectionBlock>

        {/* Recent Large Transactions */}
        <SectionBlock
          title="Recent Large Transactions"
          action={{ type: "button", label: "See All", onPress: () => {} }}
          padded={false}
        >
          {recentLargeTransactions.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={MoneyRemove01Icon} size={30} className="text-gray-300 dark:text-gray-600" />}
              title="No transactions yet"
              description="Your large transactions will appear here once you start recording."
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 shadow-sm dark:shadow-none">
              {recentLargeTransactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{tx.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{tx.category} · {tx.date}</p>
                  </div>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    -${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Spending by Category */}
        <SectionBlock title="Spending by Category" padded={false}>
          {breakdown.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={PieChartIcon} size={30} className="text-gray-300 dark:text-gray-600" />}
              title="No spending data"
              description="Add your expenses to see a breakdown by category."
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {breakdown.map((cat) => (
                <div key={cat.label} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.bg}`}>
                        <HugeiconsIcon icon={cat.icon} size={16} className="text-gray-700" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
                      {cat.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>
      </div>
    </div>
  );
}