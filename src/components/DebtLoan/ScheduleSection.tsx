// components/loans/add-loan/LoanScheduleSection.tsx
"use client";

import { RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { format, differenceInCalendarDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "./Format";
import type { ObligationCategory } from "./types";

type ScheduleSectionProps = {
  name: string;
  onNameChange: (val: string) => void;
  nameError?: string;
  nameInputRef?: RefObject<HTMLInputElement | null>;

  category: ObligationCategory;
  onCategoryChange: (val: ObligationCategory) => void;

  startDate: string;
  onStartDateChange: (val: string) => void;
  startDateError?: string;
  startDateInputRef: RefObject<HTMLButtonElement | null>;
  startDateLabel?: string;

  dueDate: string;
  onDueDateChange: (val: string) => void;
  dueDateError?: string;
  dueDateInputRef: RefObject<HTMLButtonElement | null>;
};

export function ScheduleSection({
  name,
  onNameChange,
  nameError,
  nameInputRef,
  category,
  onCategoryChange,
  startDate,
  onStartDateChange,
  startDateError,
  startDateInputRef,
  startDateLabel = "Tanggal Pemberian",
  dueDate,
  onDueDateChange,
  dueDateError,
  dueDateInputRef,
}: ScheduleSectionProps) {
  const durationDays =
    startDate && dueDate
      ? differenceInCalendarDays(new Date(dueDate), new Date(startDate))
      : null;

  return (
    <section>
      <div className="flex items-baseline justify-between px-1 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted,#8A857D)]">
          Catatan & Jadwal
        </p>
        {durationDays !== null && durationDays >= 0 && (
          <span className="text-[11px] font-semibold text-[var(--accent,#0E6E4E)] dark:text-emerald-400">
            {durationDays} hari
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--line,#E7E4DD)] dark:border-neutral-800 overflow-hidden divide-y divide-[var(--line,#E7E4DD)] dark:divide-neutral-800 bg-white dark:bg-neutral-900/40">
        {/* Catatan / Deskripsi Row */}
        <div className="px-4 py-3.5">
          <p className="text-xs text-[var(--muted,#8A857D)] mb-1">Catatan</p>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Catatan, mis. Pinjaman modal usaha"
            aria-label="Catatan piutang"
            aria-invalid={!!nameError}
            className="w-full text-[15px] font-medium bg-transparent border-none outline-none placeholder:text-neutral-300 placeholder:font-normal dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white"
          />
          {nameError && (
            <p role="alert" className="text-xs text-red-500 mt-1">
              {nameError}
            </p>
          )}
        </div>

        {/* Kategori Selector */}
        <div className="py-3.5">
          <p className="text-xs text-[var(--muted,#8A857D)] mb-2.5 px-4">Kategori</p>
          <div
            className="flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="radiogroup"
            aria-label="Kategori piutang"
          >
            {CATEGORY_OPTIONS.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onCategoryChange(c.value)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full text-sm font-medium border transition-colors",
                    active
                      ? "bg-[var(--accent-soft,#E7F1EC)] border-[var(--accent,#0E6E4E)]/30 text-[var(--accent,#0E6E4E)] dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                      : "bg-transparent text-neutral-500 dark:text-neutral-400 border-[var(--line,#E7E4DD)] dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700",
                  )}
                >
                  {active ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                  ) : (
                    <HugeiconsIcon
                      icon={c.icon}
                      size={15}
                      className="text-neutral-400 dark:text-neutral-500"
                    />
                  )}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tanggal Mulai */}
        <DateRow
          label={startDateLabel}
          value={startDate}
          onChange={onStartDateChange}
          triggerRef={startDateInputRef}
          error={startDateError}
          iconClassName="text-neutral-400 dark:text-neutral-500"
        />

        {/* Jatuh Tempo */}
        <DateRow
          label="Jatuh Tempo"
          value={dueDate}
          onChange={onDueDateChange}
          triggerRef={dueDateInputRef}
          error={dueDateError}
          min={startDate}
          iconClassName="text-amber-500"
        />
      </div>
    </section>
  );
}

function DateRow({
  label,
  value,
  onChange,
  triggerRef,
  error,
  min,
  iconClassName,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  error?: string;
  min?: string;
  iconClassName?: string;
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
        align="start"
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
