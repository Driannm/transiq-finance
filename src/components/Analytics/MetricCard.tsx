import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  icon: IconSvgElement;
  value: string;
  valueColor?: string;
  sub: ReactNode;
  isEmpty?: boolean;
  emptyIcon?: IconSvgElement;
  emptyMessage?: string;
}

function MetricCard({
  label,
  icon: Icon,
  value,
  valueColor = "text-gray-800",
  sub,
  isEmpty = false,
  emptyIcon: EmptyIcon,
  emptyMessage = "No data yet",
}: MetricCardProps) {
  if (isEmpty) {
    return (
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[96px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23D1D5DB' stroke-width='2' stroke-dasharray='6%2c 5' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
        }}
      >
        <div className="mb-1">
          {EmptyIcon ? (
            <HugeiconsIcon
              icon={EmptyIcon}
              size={22}
              className="text-gray-300 dark:text-gray-600"
            />
          ) : (
            <HugeiconsIcon
              icon={Icon}
              size={22}
              className="text-gray-300 dark:text-gray-600"
            />
          )}
        </div>
        <span className="text-xs font-medium text-gray-800 dark:text-gray-300">
          {label}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
          {emptyMessage}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        <HugeiconsIcon icon={Icon} size={14} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {sub}
    </div>
  );
}

export { MetricCard };
