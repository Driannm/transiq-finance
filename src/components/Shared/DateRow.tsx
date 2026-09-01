"use client";

import { RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function DateRow({
  label,
  value,
  onChange,
  triggerRef,
  error,
  min,
  iconClassName,
  align = "start",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  error?: string;
  min?: string;
  iconClassName?: string;
  align?: "start" | "center" | "end";
}) {
  const display = value
    ? format(new Date(value), "d MMM yyyy", { locale: idLocale })
    : "Pilih tanggal";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={label}
          aria-invalid={!!error}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-neutral-900/50"
        >
          <HugeiconsIcon
            icon={Calendar01Icon}
            size={16}
            className={`flex-shrink-0 ${iconClassName ?? ""}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--muted,#8A857D)]">{label}</p>
            <p
              className={
                value
                  ? "text-[15px] font-medium text-neutral-900 dark:text-white mt-0.5"
                  : "text-[15px] font-medium text-neutral-400 mt-0.5"
              }
            >
              {display}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-500 flex-shrink-0">
              {error}
            </p>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xl rounded-2xl"
        align={align}
      >
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          disabled={
            min ? (date) => date < new Date(min + "T00:00:00") : undefined
          }
          locale={idLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
