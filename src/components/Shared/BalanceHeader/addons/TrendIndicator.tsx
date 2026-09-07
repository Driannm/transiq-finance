"use client";

import React from "react";
import type { TrendConfig } from "../types";

export function TrendIndicator({ trend }: { trend: TrendConfig }) {
  const isPositive = trend.isPositive !== false;
  return (
    <div
      className={`inline-flex items-center gap-1 backdrop-blur-md border px-2.5 py-1 rounded-full text-xs font-semibold select-none ${
        isPositive
          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/20 border-red-500/30 text-red-300"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isPositive ? "" : "rotate-180"}
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
      <span>{trend.value}</span>
      {trend.label && (
        <span className="text-[10px] opacity-75 font-normal ml-0.5">
          {trend.label}
        </span>
      )}
    </div>
  );
}
