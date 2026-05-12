// ─────────────────────────────────────────────────────────────────────────────
// useDataControls — Core Hook
// Handles all data processing: search, sort, filter, group
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type {
  DataControlsConfig,
  DataControlsState,
  UseDataControlsReturn,
  FilterState,
  FilterValue,
  SortState,
  ViewMode,
} from "./types";

function getDefaultState(config: DataControlsConfig): DataControlsState {
  const { sort, filter, view, group } = config;

  return {
    search: "",
    sort: {
      field: sort
        ? (sort.defaultValue ?? sort.fields[0]?.value ?? "")
        : "",
      direction: sort
        ? (sort.defaultDirection ?? "asc")
        : "asc",
    },
    filters: filter
      ? (filter.defaultValues ?? {})
      : {},
    view: view
      ? (view.defaultMode ?? view.modes[0] ?? "grid")
      : "grid",
    group: group
      ? (group.defaultValue ?? "none")
      : "none",
  };
}

// Deep get nested value by dot-notation key, e.g. "user.name"
function deepGet(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// Check if a value matches a search string
function matchesSearch(item: Record<string, unknown>, query: string, keys?: string[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  const searchIn = keys?.length
    ? keys.map((k) => String(deepGet(item, k) ?? ""))
    : Object.values(item).map((v) => String(v ?? ""));

  return searchIn.some((val) => val.toLowerCase().includes(q));
}

// Apply a single filter field to an item
function applyFilter(
  item: Record<string, unknown>,
  key: string,
  value: FilterValue
): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;

  const itemValue = deepGet(item, key);

  // Boolean toggle
  if (typeof value === "boolean") {
    return Boolean(itemValue) === value;
  }

  // Range filter [min, max]
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    const num = Number(itemValue);
    const [min, max] = value as [number, number];
    return num >= min && num <= max;
  }

  // Date range [from, to]
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string"
  ) {
    const d = new Date(String(itemValue)).getTime();
    const from = value[0] ? new Date(value[0]).getTime() : -Infinity;
    const to = value[1] ? new Date(value[1]).getTime() : Infinity;
    return d >= from && d <= to;
  }

  // Multi-select: item value must be in selected array
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    const selected = value as string[];
    const iv = String(itemValue ?? "");
    return selected.includes(iv);
  }

  // Single string select / radio
  if (typeof value === "string") {
    return String(itemValue ?? "") === value;
  }

  return true;
}

// Compare two items for sorting
function compareItems(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  field: string,
  direction: "asc" | "desc"
): number {
  const av = deepGet(a, field);
  const bv = deepGet(b, field);

  let result = 0;

  if (typeof av === "number" && typeof bv === "number") {
    result = av - bv;
  } else if (av instanceof Date && bv instanceof Date) {
    result = av.getTime() - bv.getTime();
  } else {
    result = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
  }

  return direction === "asc" ? result : -result;
}

// Count active filters
function countActiveFilters(filters: FilterState, defaults: FilterState = {}): number {
  return Object.entries(filters).filter(([key, val]) => {
    const def = defaults[key];
    if (val === null || val === undefined || val === "" || val === false) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (JSON.stringify(val) === JSON.stringify(def)) return false;
    return true;
  }).length;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDataControls<T extends Record<string, unknown>>(
  rawData: T[],
  config: DataControlsConfig
): UseDataControlsReturn<T> {
  const defaultState = useMemo(() => getDefaultState(config), [config]);
  const [state, setState] = useState<DataControlsState>(defaultState);

  // Debounced search
  const searchRef = useRef(state.search);
  const[debouncedSearch, setDebouncedSearch] = useState(state.search);
  const debounceMs = config.search ? (config.search.debounce ?? 300) : 300;

  useEffect(() => {
    searchRef.current = state.search;
    const t = setTimeout(() => {
      if (searchRef.current === state.search) setDebouncedSearch(state.search);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [state.search, debounceMs]);

  // ── Derived data ──
  const data = useMemo<T[]>(() => {
    let result = [...rawData];

    // 1. Search
    if (config.search && debouncedSearch) {
      const keys = typeof config.search === 'object' ? config.search.searchKeys : undefined;
      result = result.filter((item) =>
        matchesSearch(item as Record<string, unknown>, debouncedSearch, keys)
      );
    }

    // 2. Filter
    if (config.filter && Object.keys(state.filters).length > 0) {
      result = result.filter((item) =>
        Object.entries(state.filters).every(([key, val]) =>
          applyFilter(item as Record<string, unknown>, key, val)
        )
      );
    }

    // 3. Sort
    if (config.sort && state.sort.field) {
      result = result.sort((a, b) =>
        compareItems(
          a as Record<string, unknown>,
          b as Record<string, unknown>,
          state.sort.field,
          state.sort.direction
        )
      );
    }

    return result;
  },[rawData, debouncedSearch, state.filters, state.sort, config]);

  // ── Grouped data ──
  const groupedData = useMemo<Record<string, T[]>>(() => {
    if (state.group === "none") return {};
    return data.reduce<Record<string, T[]>>((acc, item) => {
      const key = String(deepGet(item as Record<string, unknown>, state.group) ?? "Other");
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [data, state.group]);

  const activeFilterCount = useMemo(
    () =>
      countActiveFilters(
        state.filters,
        config.filter ? config.filter.defaultValues : {}
      ),
    [state.filters, config.filter]
  );

  // ── Handlers ──
  const setSearch = useCallback((v: string) => {
    setState((s) => ({ ...s, search: v }));
  },[]);

  const setSort = useCallback((v: SortState) => {
    setState((s) => ({ ...s, sort: v }));
  },[]);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setState((s) => ({ ...s, filters: { ...s.filters, [key]: value } }));
  },[]);

  const setFilters = useCallback((v: FilterState) => {
    setState((s) => ({ ...s, filters: v }));
  },[]);

  const resetFilters = useCallback(() => {
    setState((s) => ({
      ...s,
      filters: config.filter && typeof config.filter !== "boolean" ? config.filter.defaultValues ?? {} : {},
    }));
  }, [config.filter]);

  const setView = useCallback((v: ViewMode) => {
    setState((s) => ({ ...s, view: v }));
  },[]);

  const setGroup = useCallback((v: string) => {
    setState((s) => ({ ...s, group: v }));
  },[]);

  const resetAll = useCallback(() => {
    setState(defaultState);
    setDebouncedSearch("");
  }, [defaultState]);

  return {
    state,
    data,
    groupedData,
    activeFilterCount,
    setSearch,
    setSort,
    setFilter,
    setFilters,
    resetFilters,
    setView,
    setGroup,
    resetAll,
  };
}