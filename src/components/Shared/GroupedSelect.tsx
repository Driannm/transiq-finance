// src/components/Shared/GroupedSelect.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface GroupedOption {
  id: string;
  name: string;
  group: string; // e.g., "A", "B", "Makanan", "Transport"
}

interface GroupedSelectProps {
  options: GroupedOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

export function GroupedSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  icon,
  label,
  error,
}: GroupedSelectProps) {
  // Group options by group key
  const grouped = options.reduce(
    (acc, opt) => {
      if (!acc[opt.group]) acc[opt.group] = [];
      acc[opt.group].push(opt);
      return acc;
    },
    {} as Record<string, GroupedOption[]>,
  );

  // Sort groups alphabetically
  const sortedGroups = Object.keys(grouped).sort();

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
          {label}
        </label>
      )}

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={error ? "border-red-500 dark:border-red-500/50" : ""}
        >
          {icon && <span className="mr-2 text-gray-400">{icon}</span>}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <AnimatePresence mode="wait">
            {sortedGroups.map((group) => (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1 }}
              >
                <SelectGroup>
                  <SelectLabel className="sticky top-0 bg-white dark:bg-[#191919] z-10">
                    {group}
                  </SelectLabel>
                  {grouped[group].map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </motion.div>
            ))}
          </AnimatePresence>
        </SelectContent>
      </Select>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
