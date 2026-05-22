import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SavingGoal, Transaction, NewSavingGoalForm } from "@/types/saving.types";
import { DUMMY_GOALS, DUMMY_TRANSACTIONS } from "@/lib/data/savings";

// ─── helpers ───────────────────────────────────────────────────────────────
function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── store shape ───────────────────────────────────────────────────────────
type SavingStore = {
  goals: SavingGoal[];
  transactions: Transaction[];

  // actions
  addGoal: (form: NewSavingGoalForm) => void;
  deleteGoal: (goalId: string) => void;
  deposit: (goalId: string, amount: number, note: string) => void;
  withdraw: (goalId: string, amount: number, note: string) => void;

  // derived helpers (call inside component with useMemo if needed)
  getGoal: (goalId: string) => SavingGoal | undefined;
  getTransactionsByGoal: (goalId: string) => Transaction[];
};

// ─── store ─────────────────────────────────────────────────────────────────
export const useSavingStore = create<SavingStore>()(
  devtools(
    (set, get) => ({
      goals: DUMMY_GOALS,
      transactions: DUMMY_TRANSACTIONS,

      addGoal: (form) => {
        if (!form.iconId) return;

        const newGoal: SavingGoal = {
          id: generateId("goal"),
          name: form.name.trim(),
          iconId: form.iconId,
          targetAmount: Number(form.targetAmount),
          currentAmount: 0,
          deadline: form.deadline || null,
          color: form.color,
          createdAt: new Date().toISOString(),
        };

        set(
          (state) => ({ goals: [newGoal, ...state.goals] }),
          false,
          "addGoal"
        );
      },

      deleteGoal: (goalId) => {
        set(
          (state) => ({
            goals: state.goals.filter((g) => g.id !== goalId),
            transactions: state.transactions.filter((t) => t.goalId !== goalId),
          }),
          false,
          "deleteGoal"
        );
      },

      deposit: (goalId, amount, note) => {
        const tx: Transaction = {
          id: generateId("tx"),
          goalId,
          type: "deposit",
          amount,
          note,
          date: new Date().toISOString(),
        };

        set(
          (state) => ({
            transactions: [tx, ...state.transactions],
            goals: state.goals.map((g) =>
              g.id === goalId
                ? { ...g, currentAmount: g.currentAmount + amount }
                : g
            ),
          }),
          false,
          "deposit"
        );
      },

      withdraw: (goalId, amount, note) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.currentAmount < amount) return;

        const tx: Transaction = {
          id: generateId("tx"),
          goalId,
          type: "withdrawal",
          amount,
          note,
          date: new Date().toISOString(),
        };

        set(
          (state) => ({
            transactions: [tx, ...state.transactions],
            goals: state.goals.map((g) =>
              g.id === goalId
                ? { ...g, currentAmount: g.currentAmount - amount }
                : g
            ),
          }),
          false,
          "withdraw"
        );
      },

      getGoal: (goalId) => get().goals.find((g) => g.id === goalId),

      getTransactionsByGoal: (goalId) =>
        get()
          .transactions.filter((t) => t.goalId === goalId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }),
    { name: "saving-store" }
  )
);

// ─── form store (new goal form state) ─────────────────────────────────────
type GoalFormStore = {
  form: NewSavingGoalForm;
  setField: <K extends keyof NewSavingGoalForm>(key: K, value: NewSavingGoalForm[K]) => void;
  reset: () => void;
};

const INITIAL_FORM: NewSavingGoalForm = {
  name: "",
  iconId: null,
  targetAmount: "",
  deadline: "",
  color: "emerald",
};

export const useGoalFormStore = create<GoalFormStore>()((set) => ({
  form: { ...INITIAL_FORM },

  setField: (key, value) =>
    set((state) => ({ form: { ...state.form, [key]: value } })),

  reset: () => set({ form: { ...INITIAL_FORM } }),
}));
