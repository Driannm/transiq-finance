// src/hooks/useGoldPrices.ts
"use client";

import { useEffect, useState } from "react";

export interface GoldPrice {
  source: string;
  label: string;
  group: "batangan" | "perhiasan";
  karat?: number;
  buyPrice: number;
  sellPrice: number | null;
  unit: "gram";
  fetchedAt: string;
  stale: boolean;
  estimated: boolean;
}

export interface GoldPricesData {
  status: "fresh" | "stale";
  asOf: string;
  prices: GoldPrice[];
}

/**
 * Mengambil harga emas referensi dari /api/gold-prices.
 * Jika endpoint 401/503 (flag mati / tidak tersedia), data = null dan UI cukup menyembunyikan bagiannya.
 */
export function useGoldPrices() {
  const [data, setData] = useState<GoldPricesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/gold-prices", { signal: ctrl.signal });
        if (!res.ok) {
          setData(null);
          return;
        }
        setData((await res.json()) as GoldPricesData);
      } catch {
        if (!ctrl.signal.aborted) setData(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  return { data, loading };
}
