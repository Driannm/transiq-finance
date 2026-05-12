import { IconSvgElement } from "@hugeicons/react";
// ── Sort ─────────────────────────────────────────────────────────────────────

export interface SortField<T = string> {
    /** Unique key for this sort option */
    value: T;
    /** Human-readable label */
    label: string;
    /** Optional description shown below label */
    description?: string;
    /** Icon component (HugeIcons) */
    icon?: IconSvgElement;
  }
  
  export interface SortConfig<T = string> {
    fields: SortField<T>[];
    defaultValue?: T;
    defaultDirection?: SortDirection;
    /** Show direction toggle (asc/desc). Default: true */
    showDirection?: boolean;
    /** Allow multi-column sort. Default: false */
    multi?: boolean;
  }
  
  export type SortDirection = "asc" | "desc";
  
  export interface SortState<T = string> {
    field: T;
    direction: SortDirection;
  }
  
  // ── Filter ────────────────────────────────────────────────────────────────────
  
  export type FilterFieldType =
    | "select"      // single select dropdown
    | "multiselect" // multi select with checkboxes
    | "range"       // numeric range (min/max)
    | "daterange"   // date range picker
    | "toggle"      // boolean on/off
    | "radio";      // radio group
  
  export interface FilterOption {
    value: string;
    label: string;
    description?: string;
    color?: string;
    count?: number;
  }
  
  export interface FilterField {
    key: string;
    label: string;
    type: FilterFieldType;
    icon?: IconSvgElement;
    options?: FilterOption[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    placeholder?: string;
    defaultValue?: FilterValue;
  }
  
  export type FilterValue = string | string[] | boolean | [number, number] | [string, string] | null;
  
  export type FilterState = Record<string, FilterValue>;
  
  export interface FilterConfig {
    fields: FilterField[];
    defaultValues?: FilterState;
    /** Show active filter chips below toolbar. Default: true */
    showChips?: boolean;
    /** Count of active filters badge on button. Default: true */
    showCount?: boolean;
  }
  
  // ── Search ────────────────────────────────────────────────────────────────────
  
  export interface SearchConfig {
    placeholder?: string;
    /** Keys of data object to search through */
    searchKeys?: string[];
    /** Debounce delay in ms. Default: 300 */
    debounce?: number;
    /** Show search suggestions/history. Default: false */
    showSuggestions?: boolean;
    /** Expand on focus, collapse on blur when empty. Default: true */
    collapsible?: boolean;
  }
  
  // ── View ──────────────────────────────────────────────────────────────────────
  
  export type ViewMode = "grid" | "list" | "compact";
  
  export interface ViewConfig {
    modes: ViewMode[];
    defaultMode?: ViewMode;
  }
  
  // ── Grouping ──────────────────────────────────────────────────────────────────
  
  export interface GroupField {
    value: string;
    label: string;
    icon?: IconSvgElement;
  }
  
  export interface GroupConfig {
    fields: GroupField[];
    defaultValue?: string;
    /** "none" option label. Default: "No Grouping" */
    noneLabel?: string;
  }
  
  // ── DataControls Master Config ────────────────────────────────────────────────
  
  export interface DataControlsConfig {
    /** Enable search bar */
    search?: SearchConfig | false;
    /** Enable sort sheet */
    sort?: SortConfig | false;
    /** Enable filter sheet */
    filter?: FilterConfig | false;
    /** Enable view mode toggle */
    view?: ViewConfig | false;
    /** Enable grouping */
    group?: GroupConfig | false;
    /** Toolbar layout. Default: "row" */
    layout?: "row" | "compact";
  }
  
  // ── DataControls State ────────────────────────────────────────────────────────
  
  export interface DataControlsState {
    search: string;
    sort: SortState;
    filters: FilterState;
    view: ViewMode;
    group: string;
  }
  
  // ── Hook Return ───────────────────────────────────────────────────────────────
  
  export interface UseDataControlsReturn<T> {
    /** Current state */
    state: DataControlsState;
    /** Processed (filtered + sorted + grouped) data */
    data: T[];
    /** Grouped data if grouping is active */
    groupedData: Record<string, T[]>;
    /** Total active filter count */
    activeFilterCount: number;
    /** Handlers */
    setSearch: (v: string) => void;
    setSort: (v: SortState) => void;
    setFilter: (key: string, value: FilterValue) => void;
    setFilters: (v: FilterState) => void;
    resetFilters: () => void;
    setView: (v: ViewMode) => void;
    setGroup: (v: string) => void;
    resetAll: () => void;
  }