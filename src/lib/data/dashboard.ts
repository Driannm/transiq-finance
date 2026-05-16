import {
    ShoppingBag01Icon,
    Coffee01Icon,
    Car01Icon,
    Invoice02Icon,
    MoneyReceive01Icon,
    AlertCircleIcon,
    BellDotIcon,
    Notification01Icon,
    Beach02Icon,
    LaptopIcon,
    KnightShieldIcon,
    MoneySendSquareIcon,
    MoneyReceiveSquareIcon,
    MoneySend01Icon,
  } from "@hugeicons/core-free-icons";
  import type { IconSvgElement } from "@hugeicons/react";
  
  // ─── Tipe ──────────────────────────────────────
  
  export interface Transaction {
    id: number;
    name: string;
    category: string;
    time: string;
    amount: number;
    type: "expense" | "income" | "debts";
    icon: IconSvgElement;
    bg: string;
  }
  
  export interface Bill {
    id: number;
    name: string;
    icon: IconSvgElement;
    dueIn: number;
    amount: number;
    urgency: "high" | "medium" | "low";
    bg: string;
  }
  
  export interface SavingGoal {
    id: number;
    name: string;
    icon: IconSvgElement;
    saved: number;
    target: number;
    color: string;
    bg: string;
  }
  
  export interface SpendingCategory {
    label: string;
    percentage: number;
    color: string;
    amount: number;
  }
  
  export interface QuickAction {
    label: string;
    icon: IconSvgElement;
    path?: string;
    onClick?: () => void;
    iconClassName?: string;
    containerClassName?: string;
  }
  
  // ─── Data ──────────────────────────────────────
  
  export const quickActions: QuickAction[] = [
    {
      label: "Income",
      icon: MoneyReceiveSquareIcon,
      path: "/incomes",
      iconClassName: "text-green-500",
      containerClassName: "bg-green-50",
    },
    {
      label: "Expenses",
      icon: MoneySendSquareIcon,
      path: "/expenses",
      iconClassName: "text-red-500",
      containerClassName: "bg-red-50",
    },
    {
      label: "Debts",
      icon: MoneySend01Icon,
      path: "/debts",
      iconClassName: "text-orange-500",
      containerClassName: "bg-orange-50",
    },
    {
      label: "Loans",
      icon: MoneyReceive01Icon,
      path: "/loans",
      iconClassName: "text-teal-500",
      containerClassName: "bg-teal-50",
    },
  ];
  
  export const upcomingBills: Bill[] = [
    {
      id: 1,
      name: "Netflix",
      icon: AlertCircleIcon,
      dueIn: 2,
      amount: 154000,
      urgency: "high",
      bg: "bg-red-200",
    },
    {
      id: 2,
      name: "Electricity",
      icon: BellDotIcon,
      dueIn: 5,
      amount: 100000,
      urgency: "medium",
      bg: "bg-yellow-200",
    },
    {
      id: 3,
      name: "Internet",
      icon: Notification01Icon,
      dueIn: 12,
      amount: 180000,
      urgency: "low",
      bg: "bg-blue-200",
    },
  ];
  
  export const savingGoals: SavingGoal[] = [
    {
      id: 1,
      name: "Vacation Bali",
      icon: Beach02Icon,
      saved: 3200000,
      target: 5000000,
      color: "#1D9E75",
      bg: "bg-red-200",
    },
    {
      id: 2,
      name: "New Laptop",
      icon: LaptopIcon,
      saved: 1000000,
      target: 8000000,
      color: "#378ADD",
      bg: "bg-blue-200",
    },
    {
      id: 3,
      name: "Emergency Fund",
      icon: KnightShieldIcon,
      saved: 4500000,
      target: 6000000,
      color: "#1D9E75",
      bg: "bg-red-200",
    },
  ];
  
  export const spendingCategories: SpendingCategory[] = [
    { label: "Food & Drinks", percentage: 40, color: "#E24B4A", amount: 388000 },
    { label: "Transport", percentage: 20, color: "#378ADD", amount: 194000 },
    { label: "Entertainment", percentage: 25, color: "#EF9F27", amount: 242500 },
    { label: "Others", percentage: 15, color: "#B5D4F4", amount: 145500 },
  ];