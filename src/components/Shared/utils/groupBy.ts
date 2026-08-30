/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Shared/utils/groupBy.ts
export function getRelativeDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hari Ini";
  if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function groupItemsBy<T>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export interface GroupedResult<T> {
  key: string;
  items: T[];
  subtotal: number;
  formattedSubtotal: string;
}

export function groupTransactionsWithSubtotal<
  T extends {
    date?: string;
    amount?: number;
    type?: "expense" | "income" | "transfer";
  },
>(
  items: T[],
  options?: {
    groupBy?: (item: T) => string;
    subtotalFormatter?: (amount: number) => string;
    includeSign?: boolean;
    amountExtractor?: (item: T) => number;
    typeExtractor?: (item: T) => "expense" | "income" | "transfer" | undefined;
  },
): GroupedResult<T>[] {
  const groupBy =
    options?.groupBy ||
    ((item: T) => (item.date ? getRelativeDateLabel(item.date) : "Lainnya"));

  const groups = groupItemsBy(items, groupBy);

  return Object.entries(groups).map(([key, groupItems]) => {
    const subtotal = groupItems.reduce((sum, item) => {
      const amount = options?.amountExtractor
        ? options.amountExtractor(item)
        : ((item as any).amount ?? 0);

      const type = options?.typeExtractor
        ? options.typeExtractor(item)
        : (item as any).type;

      if (type === "expense") return sum - amount;
      if (type === "income") return sum + amount;
      return sum;
    }, 0);

    const formatter =
      options?.subtotalFormatter ||
      ((amt: number) => {
        const sign =
          options?.includeSign !== false && amt !== 0
            ? amt > 0
              ? "+"
              : ""
            : "";
        return `${sign}IDR ${new Intl.NumberFormat("id-ID").format(Math.abs(amt))}`;
      });

    return {
      key,
      items: groupItems,
      subtotal,
      formattedSubtotal: formatter(subtotal),
    };
  });
}
