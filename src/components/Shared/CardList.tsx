import { ReactNode } from "react";

export function CardList<T>({
  items,
  renderItem,
  keyExtractor = (_, idx) => idx as string | number,
  emptyState,
  className = "",
}: {
  items: T[];
  renderItem: (item: T, index: number) => { left: ReactNode; right: ReactNode };
  keyExtractor?: (item: T, index: number) => string | number;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div
  className={`bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none divide-y divide-gray-100 dark:divide-neutral-800 ${className}`}
>
      {items.map((item, index) => {
        const { left, right } = renderItem(item, index);
        return (
          <div
            key={keyExtractor(item, index)}
            className="flex items-center justify-between px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">{left}</div>
            <div className="flex-shrink-0 ml-2">{right}</div>
          </div>
        );
      })}
    </div>
  );
}