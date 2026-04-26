"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { IslandNavbar } from "@/components/Layout/MobileHeader";
import { SectionBlock, EmptyState } from "@/components/Shared/SectionBlock";
import { CardList } from "@/components/Shared/CardList";
import { Add01Icon, ShoppingBag01Icon, Invoice02Icon, Calendar02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { format } from "date-fns";

// ─── Type ─────────────────────────────────────────────────────────────────────

interface ExpenseItem {
  id: string;
  name: string;
  date: string;
  subtotal: number;
  category?: { id: string; name: string } | null;
  transaction: {
    amount: number;
    card: { id: string; name: string };
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${month}`);
    const data = await res.json();
    setExpenses(data.expenses);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [month]);

  const prevMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() - 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const nextMonth = () => {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() + 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const total = expenses.reduce((sum, e) => sum + e.transaction.amount, 0);
  
  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-24">
      <IslandNavbar
        title="Expenses"
        avatarIcon={<HugeiconsIcon icon={ArrowLeft02Icon} size={22} />}
        onAvatarPress={handleBack}
        actions={[
          {
            icon: (
              <Link href="/expenses/add">
                <HugeiconsIcon icon={Add01Icon} size={18} />
              </Link>
            ),
            onPress: () => {},
            label: "Add",
          },
        ]}
      />

      <div className="px-4 pt-4 space-y-5">
        {/* Month selector */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
          <button onClick={prevMonth} className="text-gray-500 dark:text-gray-400 text-lg p-1">
            ‹
          </button>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar02Icon} size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {format(new Date(month + "-01"), "MMMM yyyy")}
            </span>
          </div>
          <button onClick={nextMonth} className="text-gray-500 dark:text-gray-400 text-lg p-1">
            ›
          </button>
        </div>

        {/* Total */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-500">IDR {formatIDR(total)}</p>
        </div>

        {/* List expenses */}
        <SectionBlock title="Semua Expenses" padded={false}>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Memuat...</div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Invoice02Icon} size={32} className="text-gray-300 dark:text-gray-600" />}
              title="Belum ada pengeluaran"
              description="Catat pengeluaran pertama kamu."
            />
          ) : (
            <CardList
              items={expenses}
              keyExtractor={(e) => e.id}
              renderItem={(expense) => ({
                left: (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <HugeiconsIcon icon={ShoppingBag01Icon} size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {expense.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {expense.category?.name ?? "Uncategorized"} ·{" "}
                        {format(new Date(expense.date), "dd MMM")} ·{" "}
                        {expense.transaction.card.name}
                      </p>
                    </div>
                  </>
                ),
                right: (
                  <span className="text-sm font-semibold text-red-500">
                    -IDR {formatIDR(expense.transaction.amount)}
                  </span>
                ),
              })}
            />
          )}
        </SectionBlock>
      </div>
    </div>
  );
}