import { HugeiconsIcon } from "@hugeicons/react";
import { Download03Icon, Upload03Icon, Wallet01Icon } from "@hugeicons/core-free-icons";

import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { StatCard } from "@/components/Dashboard/StatCard";
import { AnalyticsChart } from "@/components/Dashboard/AnalyticsChart";
import { TransactionList } from "@/components/Dashboard/TransactionList";
import { ActionPanel } from "@/components/Dashboard/ActionPanel";
import { StockPortfolioChart } from "@/components/Dashboard/StockPortfolioChart";
import { QuickLinkCard } from "@/components/Dashboard/QuickLinkCard";

const STAT_CARDS = [
  {
    label: "Balance",
    value: "$1,655",
    change: "+12%",
    changePositive: true,
    bgColor: "bg-violet-100",
    iconBg: "bg-violet-200",
    icon: <HugeiconsIcon icon={Wallet01Icon} />,
  },
  {
    label: "Income",
    value: "$435",
    change: "+4%",
    changePositive: true,
    bgColor: "bg-purple-100",
    iconBg: "bg-purple-200",
    icon: <HugeiconsIcon icon={Download03Icon} />,
  },
  {
    label: "Expenses",
    value: "$842",
    change: "-2%",
    changePositive: false,
    bgColor: "bg-green-100",
    iconBg: "bg-green-200",
    icon: <HugeiconsIcon icon={Upload03Icon} />,
  },
];

const TRANSACTIONS = [
  {
    label: "Today",
    items: [
      { id: "1", name: "Stoneblack", description: "Payment for goods", amount: -23, date: "Today", avatarBg: "bg-gray-800", avatarFallback: "S" },
      { id: "2", name: "WorldTok", description: "Shares", amount: 45, date: "Today", avatarBg: "bg-orange-500", avatarFallback: "W" },
      { id: "3", name: "Niko", description: "Transfer", amount: 30, date: "Today", avatarBg: "bg-violet-500", avatarFallback: "N" },
    ],
  },
  {
    label: "September 14, Sat",
    items: [
      { id: "4", name: "Viky", description: "Transfer", amount: 23, date: "Sep 14", avatarBg: "bg-rose-400", avatarFallback: "V" },
      { id: "5", name: "GreenCo", description: "Payment for goods", amount: -140, date: "Sep 14", avatarBg: "bg-emerald-600", avatarFallback: "G" },
    ],
  },
];

const FAVORITE_SPENDS = [
  { name: "VK",   color: "bg-blue-600",   icon: <span className="text-[10px] font-bold">VK</span> },
  { name: "OK",   color: "bg-orange-500", icon: <span className="text-[10px] font-bold">OK</span> },
  { name: "Snap", color: "bg-yellow-400", icon: <span className="text-[10px] font-bold">👻</span> },
];

const QUICK_LINKS = [
  { label: "Investments",    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80", imageAlt: "Investments" },
  { label: "Your finances",  imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80", imageAlt: "Your finances" },
  { label: "Piggy bank",     imageUrl: "https://images.unsplash.com/photo-1635840420799-f75477b0b977?w=400&q=80", imageAlt: "Piggy bank" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">

      <DashboardHeader userName="Gabby" notificationCount={3} />

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STAT_CARDS.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <AnalyticsChart />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_180px] gap-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <TransactionList groups={TRANSACTIONS} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <ActionPanel expensesThisMonth="$1262.22" favoriteSpends={FAVORITE_SPENDS} />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm flex-1">
            <StockPortfolioChart />
          </div>
        </div>
        <div className="hidden xl:flex flex-col gap-3">
          {QUICK_LINKS.map((ql) => (
            <QuickLinkCard key={ql.label} {...ql} />
          ))}
        </div>
      </div>

    </div>
  );
}