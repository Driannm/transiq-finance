"use client";

import { useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";
import { SortSheet } from "./SortSheet";
import { FilterSheet, ActiveFilterChips } from "./FilterSheet";
import { ViewToggle, GroupSheet } from "./ViewToggle";
import type {
  DataControlsConfig,
  DataControlsState,
  FilterState,
  FilterValue,
  SortState,
  ViewMode,
} from "./types";

interface DataControlsBarProps {
  config: DataControlsConfig;
  state: DataControlsState;
  activeFilterCount: number;
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortState) => void;
  onFilterChange: (key: string, value: FilterValue) => void;
  onFiltersChange: (v: FilterState) => void;
  onFiltersReset: () => void;
  onViewChange: (v: ViewMode) => void;
  onGroupChange: (v: string) => void;
  className?: string;
}

export function DataControlsBar({
  config,
  state,
  activeFilterCount,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onFiltersChange,
  onFiltersReset,
  onViewChange,
  onGroupChange,
  className,
}: DataControlsBarProps) {

  // ✅ safer feature flags (no boolean | object confusion)
  const hasSearch = !!config.search;
  const hasSort   = !!config.sort;
  const hasFilter = !!config.filter;
  const hasView   = !!config.view;
  const hasGroup  = !!config.group;

  // ✅ FIXED: safe optional chaining
  const showChips =
    hasFilter &&
    config.filter?.showChips !== false &&
    activeFilterCount > 0;

  const handleFilterApply = useCallback(
    (newState: FilterState) => onFiltersChange(newState),
    [onFiltersChange]
  );

  const handleChipRemove = useCallback(
    (key: string) => onFilterChange(key, null),
    [onFilterChange]
  );

  // ✅ FIXED: safe access with optional chaining
  const isSortActive =
    hasSort &&
    state.sort.field !==
      (config.sort?.defaultValue ??
        config.sort?.fields?.[0]?.value ??
        "");

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {hasSearch && (
          <SearchBar
            config={config.search}
            value={state.search}
            onChange={onSearchChange}
            className="flex-1 min-w-0"
          />
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasSort && config.sort && (
            <SortSheet
              config={config.sort}
              value={state.sort}
              onChange={onSortChange}
              isActive={isSortActive}
            />
          )}

          {hasFilter && config.filter && (
            <FilterSheet
              config={config.filter}
              value={state.filters}
              activeCount={activeFilterCount}
              onChange={onFilterChange}
              onReset={onFiltersReset}
              onApply={handleFilterApply}
            />
          )}

          {hasGroup && config.group && (
            <GroupSheet
              config={config.group}
              value={state.group}
              onChange={onGroupChange}
            />
          )}

          {hasView && config.view && (
            <ViewToggle
              config={config.view}
              value={state.view}
              onChange={onViewChange}
            />
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showChips && config.filter && (
          <ActiveFilterChips
            config={config.filter}
            filters={state.filters}
            onRemove={handleChipRemove}
            onClearAll={onFiltersReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}