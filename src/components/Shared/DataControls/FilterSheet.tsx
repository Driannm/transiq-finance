// ─────────────────────────────────────────────────────────────────────────────
// FilterSheet — Bottom sheet for all filter types
// Supports: select, multiselect, range, daterange, toggle, radio
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon, Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FilterConfig, FilterState, FilterValue, FilterField } from "./types";

// ── Single field renderers ────────────────────────────────────────────────────

function SelectField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(isSelected ? null : opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all",
              isSelected
                ? "bg-[#6366F1] border-[#6366F1] text-white"
                : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:border-slate-300"
            )}
          >
            {opt.color && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
            )}
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn("text-[11px]", isSelected ? "opacity-70" : "text-slate-400 dark:text-neutral-500")}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const selected = (Array.isArray(value) ? value : []) as string[];

  const toggle = (v: string) => {
    const next = selected.includes(v)
      ? selected.filter((s) => s !== v)
      : [...selected, v];
    onChange(next.length ? next : null);
  };

  return (
    <div className="space-y-1">
      {field.options?.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
              isSelected
                ? "border-[#6366F1] bg-[#6366F1]/5 dark:bg-[#6366F1]/10"
                : "border-slate-100 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800"
            )}
          >
            <div className="flex items-center gap-3">
              {opt.color && (
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              )}
              <div className="text-left">
                <span className={cn(
                  "text-[13px] font-semibold",
                  isSelected ? "text-[#6366F1]" : "text-slate-700 dark:text-neutral-300"
                )}>
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">{opt.description}</p>
                )}
              </div>
            </div>
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0",
              isSelected
                ? "bg-[#6366F1] border-[#6366F1]"
                : "border-slate-300 dark:border-neutral-600"
            )}>
              {isSelected && (
                <HugeiconsIcon icon={Tick01Icon} size={11} className="text-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RangeField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const range = (Array.isArray(value) && typeof value[0] === "number")
    ? (value as [number, number])
    : [min, max];

  const fmt = (n: number) => {
    if (field.unit === "$" || field.unit === "IDR") {
      return `${field.unit}${n.toLocaleString()}`;
    }
    return `${n.toLocaleString()}${field.unit ? ` ${field.unit}` : ""}`;
  };

  return (
    <div>
      <div className="flex justify-between mb-3">
        <span className="text-[13px] font-bold text-[#6366F1]">{fmt(range[0])}</span>
        <span className="text-[13px] font-bold text-[#6366F1]">{fmt(range[1])}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={range}
        onValueChange={(v) => onChange(v as [number, number])}
        className="[&>[data-slot=slider-thumb]]:bg-[#6366F1] [&>[data-slot=slider-range]]:bg-[#6366F1]"
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-slate-400 dark:text-neutral-500">{fmt(min)}</span>
        <span className="text-[11px] text-slate-400 dark:text-neutral-500">{fmt(max)}</span>
      </div>
    </div>
  );
}

function DateRangeField({
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const range = (Array.isArray(value) && typeof value[0] === "string")
    ? (value as [string, string])
    : ["", ""];

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5 block">From</label>
        <input
          type="date"
          value={range[0]}
          onChange={(e) => onChange([e.target.value, range[1]])}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
        />
      </div>
      <div className="flex-1">
        <label className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5 block">To</label>
        <input
          type="date"
          value={range[1]}
          onChange={(e) => onChange([range[0], e.target.value])}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
        />
      </div>
    </div>
  );
}

function ToggleField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800">
      <Label className="text-[14px] font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer">
        {field.placeholder ?? "Enable"}
      </Label>
      <Switch
        checked={value === true}
        onCheckedChange={(v) => onChange(v ? true : null)}
        className="data-[state=checked]:bg-[#6366F1]"
      />
    </div>
  );
}

function RadioField({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="space-y-2">
      {field.options?.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(isSelected ? null : opt.value)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all",
              isSelected
                ? "border-[#6366F1] bg-[#6366F1]/5 dark:bg-[#6366F1]/10"
                : "border-slate-100 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800"
            )}
          >
            <div className="text-left">
              <p className={cn(
                "text-[14px] font-semibold",
                isSelected ? "text-[#6366F1]" : "text-slate-800 dark:text-neutral-200"
              )}>
                {opt.label}
              </p>
              {opt.description && (
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">{opt.description}</p>
              )}
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              isSelected ? "border-[#6366F1]" : "border-slate-300 dark:border-neutral-600"
            )}>
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  switch (field.type) {
    case "select":      return <SelectField field={field} value={value} onChange={onChange} />;
    case "multiselect": return <MultiSelectField field={field} value={value} onChange={onChange} />;
    case "range":       return <RangeField field={field} value={value} onChange={onChange} />;
    case "daterange":   return <DateRangeField field={field} value={value} onChange={onChange} />;
    case "toggle":      return <ToggleField field={field} value={value} onChange={onChange} />;
    case "radio":       return <RadioField field={field} value={value} onChange={onChange} />;
    default:            return null;
  }
}

// ── Main FilterSheet ──────────────────────────────────────────────────────────

interface FilterSheetProps {
  config: FilterConfig;
  value: FilterState;
  activeCount: number;
  onChange: (key: string, value: FilterValue) => void;
  onReset: () => void;
  onApply: (state: FilterState) => void;
}

export function FilterSheet({
  config,
  value,
  activeCount,
  onChange,
  onReset,
  onApply,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<FilterState>(value);

  const handleOpen = useCallback(() => {
    setPending(value);
    setOpen(true);
  }, [value]);

  const handleApply = useCallback(() => {
    onApply(pending);
    setOpen(false);
  }, [pending, onApply]);

  const handleReset = useCallback(() => {
    const defaults = config.defaultValues ?? {};
    setPending(defaults);
    onReset();
    setOpen(false);
  }, [config.defaultValues, onReset]);

  const setPendingField = useCallback((key: string, val: FilterValue) => {
    setPending((p) => ({ ...p, [key]: val }));
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={cn(
          "relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-[13px] font-semibold transition-all",
          activeCount > 0
            ? "bg-[#6366F1] border-[#6366F1] text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
            : "bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-600"
        )}
      >
        <HugeiconsIcon icon={FilterIcon} size={15} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[11px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-t-3xl w-full max-w-md shadow-2xl flex flex-col"
              style={{ maxHeight: "85vh" }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="w-10 h-1 bg-slate-200 dark:bg-neutral-700 rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-bold text-slate-900 dark:text-neutral-100">Filter</h3>
                  {activeCount > 0 && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 text-[13px] font-semibold text-red-500"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable fields */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                {config.fields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 mb-3">
                      {field.icon && (
                        <HugeiconsIcon icon={field.icon} size={15} className="text-slate-400 dark:text-neutral-500" />
                      )}
                      <h4 className="text-[13px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide">
                        {field.label}
                      </h4>
                    </div>
                    <FieldRenderer
                      field={field}
                      value={pending[field.key] ?? field.defaultValue ?? null}
                      onChange={(val) => setPendingField(field.key, val)}
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-8 pt-4 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0 flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-0 hover:bg-slate-200 dark:hover:bg-neutral-700"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 h-12 rounded-xl font-bold bg-[#6366F1] text-white hover:bg-[#4F46E5]"
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Active Filter Chips ───────────────────────────────────────────────────────

interface ActiveChipsProps {
  config: FilterConfig;
  filters: FilterState;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({ config, filters, onRemove, onClearAll }: ActiveChipsProps) {
  const activeFields = config.fields.filter((field) => {
    const val = filters[field.key];
    if (!val) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  if (activeFields.length === 0) return null;

  const getChipLabel = (field: FilterField, val: FilterValue): string => {
    if (typeof val === "boolean") return field.label;
    if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
      const labels = (val as string[])
        .map((v) => field.options?.find((o) => o.value === v)?.label ?? v)
        .join(", ");
      return `${field.label}: ${labels}`;
    }
    if (Array.isArray(val) && val.every((v) => typeof v === "number")) {
      return `${field.label}: ${val[0]}–${val[1]}${field.unit ? ` ${field.unit}` : ""}`;
    }
    if (typeof val === "string") {
      const label = field.options?.find((o) => o.value === val)?.label ?? val;
      return `${field.label}: ${label}`;
    }
    return field.label;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {activeFields.map((field) => (
        <motion.button
          key={field.key}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => onRemove(field.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366F1]/10 dark:bg-[#6366F1]/20 rounded-full text-[12px] font-bold text-[#6366F1]"
        >
          {getChipLabel(field, filters[field.key])}
          <HugeiconsIcon icon={Cancel01Icon} size={10} />
        </motion.button>
      ))}
      {activeFields.length > 1 && (
        <motion.button
          layout
          onClick={onClearAll}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full text-[12px] font-bold text-slate-500 dark:text-neutral-400"
        >
          Clear all
        </motion.button>
      )}
    </motion.div>
  );
}