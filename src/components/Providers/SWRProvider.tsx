"use client";

import { SWRConfig, type SWRConfiguration } from "swr";
import { ReactNode } from "react";

// Default config untuk seluruh app
const swrConfig: SWRConfiguration = {
  fetcher: (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }),
  // Retry config
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Deduping: hindari duplicate request dalam window ini
  dedupingInterval: 5000,
  // Revalidate behavior
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  // Stale time: data dianggap fresh selama ini (tidak auto-fetch)
  staleTime: 30000, // 30 detik
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}