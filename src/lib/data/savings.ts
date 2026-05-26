import type { SavingGoal, Transaction } from "@/types/saving.types";

export const DUMMY_GOALS: SavingGoal[] = [
  {
    id: "goal-1",
    name: "Dana Darurat",
    iconId: "HeartCheckIcon",
    targetAmount: 30_000_000,
    currentAmount: 18_500_000,
    deadline: "2025-12-31",
    color: "emerald",
    createdAt: "2024-01-10",
  },
  {
    id: "goal-2",
    name: "Liburan ke Jepang",
    iconId: "Airplane01Icon",
    targetAmount: 20_000_000,
    currentAmount: 7_200_000,
    deadline: "2025-08-01",
    color: "blue",
    createdAt: "2024-03-01",
  },
  {
    id: "goal-3",
    name: "DP Rumah",
    iconId: "Home01Icon",
    targetAmount: 150_000_000,
    currentAmount: 42_000_000,
    deadline: "2027-01-01",
    color: "amber",
    createdAt: "2023-06-15",
  },
  {
    id: "goal-4",
    name: "Laptop Baru",
    iconId: "SmartphoneIcon",
    targetAmount: 18_000_000,
    currentAmount: 18_000_000,
    deadline: "2025-03-01",
    color: "purple",
    createdAt: "2024-08-01",
  },
];

export const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: "tx-1",  goalId: "goal-1", type: "deposit",    amount: 2_000_000, note: "Gajian bulan ini",       date: "2025-06-01" },
  { id: "tx-2",  goalId: "goal-2", type: "deposit",    amount: 500_000,   note: "Sisa uang jajan",        date: "2025-06-02" },
  { id: "tx-3",  goalId: "goal-3", type: "deposit",    amount: 5_000_000, note: "Bonus tahunan",          date: "2025-05-28" },
  { id: "tx-4",  goalId: "goal-1", type: "withdrawal", amount: 300_000,   note: "Keperluan mendadak",     date: "2025-05-25" },
  { id: "tx-5",  goalId: "goal-4", type: "deposit",    amount: 1_000_000, note: "Tambahan akhir bulan",   date: "2025-05-20" },
  { id: "tx-6",  goalId: "goal-2", type: "deposit",    amount: 700_000,   note: "Freelance project",      date: "2025-05-15" },
  { id: "tx-7",  goalId: "goal-1", type: "deposit",    amount: 2_000_000, note: "Gajian bulan lalu",      date: "2025-05-01" },
  { id: "tx-8",  goalId: "goal-3", type: "deposit",    amount: 5_000_000, note: "Transfer rutin",         date: "2025-04-28" },
];
