import {
    Calendar02Icon,
    Share01Icon,
    ArrowUp01Icon,
    ArrowDown01Icon,
    Download04Icon,
    FilterHorizontalIcon,
  } from "@hugeicons/core-free-icons";
  
  // ─── Types ────────────────────────────────────────────────────────────────────
  
  export type Period = "Week" | "Month" | "Year" | "All";
  
  export interface ChartDataPoint {
    label: string;
    value: number;
    prevValue: number;
  }
  
  export interface PeriodStats {
    totalSpent: number;
    prevTotalSpent: number;
    income: number;
    budget: number;
  }
  
  export interface BreakdownCategory {
    label: string;
    amount: number;
    pct: number;
    color: string;
    bg: string;
    icon: any;
  }
  
  export interface LargeTransaction {
    name: string;
    amount: number;
    date: string;
    category: string;
  }
  
  // ─── Chart Data ───────────────────────────────────────────────────────────────
  
  export const dailyData: Record<Period, ChartDataPoint[]> = {
    Week: [
      { label: "Mon", value: 65, prevValue: 45 },
      { label: "Tue", value: 80, prevValue: 60 },
      { label: "Wed", value: 70, prevValue: 75 },
      { label: "Thu", value: 85, prevValue: 70 },
      { label: "Fri", value: 90, prevValue: 65 },
      { label: "Sat", value: 55, prevValue: 50 },
      { label: "Sun", value: 40, prevValue: 35 },
    ],
    Month: [
      { label: "1", value: 45, prevValue: 30 },
      { label: "5", value: 60, prevValue: 45 },
      { label: "10", value: 85, prevValue: 70 },
      { label: "15", value: 75, prevValue: 60 },
      { label: "20", value: 95, prevValue: 80 },
      { label: "25", value: 55, prevValue: 40 },
      { label: "30", value: 65, prevValue: 50 },
    ],
    Year: [
      { label: "Jan", value: 70, prevValue: 50 },
      { label: "Mar", value: 90, prevValue: 70 },
      { label: "May", value: 85, prevValue: 65 },
      { label: "Jul", value: 60, prevValue: 55 },
      { label: "Sep", value: 75, prevValue: 70 },
      { label: "Nov", value: 65, prevValue: 50 },
    ],
    All: [
      { label: "2021", value: 45, prevValue: 25 },
      { label: "2022", value: 65, prevValue: 40 },
      { label: "2023", value: 80, prevValue: 55 },
      { label: "2024", value: 95, prevValue: 70 },
      { label: "2025", value: 110, prevValue: 85 },
      { label: "2026", value: 50, prevValue: 30 },
    ],
  };
  
  // ─── Period Stats ─────────────────────────────────────────────────────────────
  
  export const periodStats: Record<Period, PeriodStats> = {
    Week: { totalSpent: 892.4, prevTotalSpent: 865.3, income: 1240.0, budget: 1000.0 },
    Month: { totalSpent: 3842.15, prevTotalSpent: 3540.8, income: 5240.0, budget: 4000.0 },
    Year: { totalSpent: 42853.0, prevTotalSpent: 38234.5, income: 62400.0, budget: 48000.0 },
    All: { totalSpent: 128430.0, prevTotalSpent: 97450.2, income: 186000.0, budget: 144000.0 },
  };
  
  // ─── Spending Breakdown ───────────────────────────────────────────────────────
  
  export const breakdown: BreakdownCategory[] = [
    { label: "Housing", amount: 1200.0, pct: 32, color: "#3B5BDB", bg: "bg-blue-100", icon: Calendar02Icon },
    { label: "Food & Drink", amount: 840.5, pct: 22, color: "#7C5CBF", bg: "bg-purple-100", icon: Share01Icon },
    { label: "Transport", amount: 420.0, pct: 11, color: "#20C997", bg: "bg-green-100", icon: ArrowUp01Icon },
    { label: "Shopping", amount: 380.75, pct: 10, color: "#FF6B35", bg: "bg-orange-100", icon: Download04Icon },
    { label: "Health", amount: 200.0, pct: 5, color: "#FF3B30", bg: "bg-red-100", icon: FilterHorizontalIcon },
    { label: "Others", amount: 800.9, pct: 20, color: "#94A3B8", bg: "bg-gray-100", icon: ArrowDown01Icon },
  ];
  
  // ─── Recent Large Transactions ────────────────────────────────────────────────
  
  export const recentLargeTransactions: LargeTransaction[] = [
    { name: "Grocery Store", amount: 124.5, date: "Today", category: "Food" },
    { name: "Electric Bill", amount: 98.2, date: "Yesterday", category: "Housing" },
    { name: "Online Shopping", amount: 79.99, date: "Mar 12", category: "Shopping" },
  ];