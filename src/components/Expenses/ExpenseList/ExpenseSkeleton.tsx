// src/components/Expenses/ExpenseList/ExpenseSkeleton.tsx
"use client";

import { SkeletonItem } from "@/components/Shared/CardList/SkeletonField";

// Renders N skeleton rows matching the actual expense item layout (detailed variant).
export function ExpenseSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200/40 dark:border-neutral-800/40 divide-y divide-gray-100/60 dark:divide-neutral-800/50 shadow-sm">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem
          key={i}
          variant="detailed"
          fields={["icon", "title", "subtitle", "amount", "date"]}
        />
      ))}
    </div>
  );
}
