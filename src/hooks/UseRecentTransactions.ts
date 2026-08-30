"use client";

import useSWR from "swr";

export interface RecentTransaction {
  id: string;
  name: string;
  category: string;
  time: string;
  amount: number;
  type: "expense" | "income" | "debts";
  originalType: string;
  date: string;
}

export interface RecentTransactionsResponse {
  transactions: RecentTransaction[];
  error?: string;
}

export function useRecentTransactions() {
  return useSWR<RecentTransactionsResponse>("/api/transactions/recent", {
    // Refresh tiap 60 detik (bisa disesuaikan)
    refreshInterval: 60_000,
    // Tetap revalidate saat tab aktif kembali
    revalidateOnFocus: true,
    // Jangan retry untuk 401/403 (auth error)
    shouldRetryOnError: (error) => {
      if (!error) return true;
      const status = error?.status || error?.response?.status;
      return ![401, 403].includes(status);
    },
  });
}
