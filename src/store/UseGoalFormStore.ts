import { create } from "zustand";
import { IconId } from "@/components/Shared/IconPicker/icon-picker.types";

// store/useSavingStore.ts (Bagian Form)
type GoalFormState = {
  name: string;
  targetAmount: string;
  currency: string;
  deadline: string;
  note: string;
  iconId: string | null;
  setField: (field: keyof Omit<GoalFormState, 'setField' | 'reset'>, value: any) => void;
  reset: () => void;
};

const initialState = {
  name: "",
  targetAmount: "",
  currency: "USD",
  deadline: "",
  note: "",
  iconId: null,
};

export const useGoalFormStore = create<GoalFormState>((set) => ({
  ...initialState,
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  reset: () => set(initialState),
}));