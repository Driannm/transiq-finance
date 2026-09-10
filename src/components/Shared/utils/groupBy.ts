import { startOfWeek, differenceInCalendarWeeks, isValid } from "date-fns";

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

export const WEEK_LABEL_ORDER: Record<string, number> = {
  Sebelumnya: 1,
  "Minggu Lalu": 2,
  "Minggu Ini": 3,
  "Minggu Depan": 4,
  "2 Minggu Lagi": 5,
  Berikutnya: 6,
};

export function getRelativeWeekLabel(
  dateInput: Date | string,
  baseDate: Date = new Date(),
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!isValid(date)) return "Lainnya";

  const targetWeekStart = startOfWeek(date, { weekStartsOn: 1 });
  const baseWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 });

  const diffInWeeks = differenceInCalendarWeeks(
    targetWeekStart,
    baseWeekStart,
    {
      weekStartsOn: 1,
    },
  );

  if (diffInWeeks < -1) return "Sebelumnya";
  if (diffInWeeks === -1) return "Minggu Lalu";
  if (diffInWeeks === 0) return "Minggu Ini";
  if (diffInWeeks === 1) return "Minggu Depan";
  if (diffInWeeks === 2) return "2 Minggu Lagi";
  return "Berikutnya";
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

export function compareWeekGroups<T>(
  a: GroupedResult<T>,
  b: GroupedResult<T>,
): number {
  const orderA = WEEK_LABEL_ORDER[a.key] ?? 99;
  const orderB = WEEK_LABEL_ORDER[b.key] ?? 99;
  return orderA - orderB;
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
    groupSorter?: (a: GroupedResult<T>, b: GroupedResult<T>) => number;
    subtotalFormatter?: (amount: number) => string;
    includeSign?: boolean;
    amountExtractor?: (item: T) => number;
    typeExtractor?: (
      item: T,
    ) => "expense" | "income" | "transfer" | "debts" | "loans" | "bills" | undefined;
  },
): GroupedResult<T>[] {
  const groupBy =
    options?.groupBy ||
    ((item: T) => (item.date ? getRelativeDateLabel(item.date) : "Lainnya"));

  const groups = groupItemsBy(items, groupBy);

  const result = Object.entries(groups).map(([key, groupItems]) => {
    const subtotal = groupItems.reduce((sum, item) => {
      const amount = options?.amountExtractor
        ? options.amountExtractor(item)
        : ((item as any).amount ?? 0);

      const type = options?.typeExtractor
        ? options.typeExtractor(item)
        : (item as any).type;

      if (type === "expense") return sum - amount;
      if (type === "income") return sum + amount;
      return sum + Math.abs(amount);
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

  if (options?.groupSorter) {
    result.sort(options.groupSorter);
  }

  return result;
}
