export type SavingCategory = "saving" | "bill" | "general";

export type TransactionType = "deposit" | "withdrawal";

export type Transaction = {
  id: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  note: string;
  date: string; // ISO string
};

export type SavingGoal = {
  id: string;
  name: string;
  iconId: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null; // ISO date string
  color: string; // tailwind color token e.g. "emerald"
  createdAt: string;
};

export type NewSavingGoalForm = {
  name: string;
  iconId: string | null;
  targetAmount: string;
  deadline: string;
  color: string;
};
