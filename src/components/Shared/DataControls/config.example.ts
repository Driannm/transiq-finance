// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE USAGES — DataControls di berbagai halaman berbeda
// Copy-paste config yang dibutuhkan, nonaktifkan yang tidak perlu
// ─────────────────────────────────────────────────────────────────────────────

import type { DataControlsConfig } from "@/components/Shared/DataControls";

// ────────────────────────────────────────────────────────────
// EXAMPLE 1: Transaction History page
// Features: search + filter(type, date range, amount) + sort
// Disabled: view toggle, group
// ────────────────────────────────────────────────────────────

export const TRANSACTION_CONTROLS: DataControlsConfig = {
  search: {
    placeholder: "Search transactions...",
    searchKeys: ["description", "category", "merchant"],
    debounce: 200,
    collapsible: false, // always visible
  },

  sort: {
    defaultValue: "date",
    defaultDirection: "desc",
    fields: [
      { value: "date",        label: "Date",        description: "Newest first"    },
      { value: "amount",      label: "Amount",      description: "Largest first"   },
      { value: "description", label: "Description", description: "A to Z"          },
    ],
  },

  filter: {
    showChips: true,
    fields: [
      {
        key: "type",
        label: "Transaction Type",
        type: "multiselect",
        options: [
          { value: "income",    label: "Income",    color: "#22C55E" },
          { value: "expense",   label: "Expense",   color: "#EF4444" },
          { value: "transfer",  label: "Transfer",  color: "#6366F1" },
        ],
      },
      {
        key: "date",
        label: "Date Range",
        type: "daterange",
      },
      {
        key: "amount",
        label: "Amount Range",
        type: "range",
        min: 0,
        max: 50000000,
        step: 100000,
        unit: "IDR",
      },
    ],
  },

  view: false,   // ← disabled
  group: false,  // ← disabled
};

// ────────────────────────────────────────────────────────────
// EXAMPLE 2: Budget Categories page
// Features: search + view toggle (grid/list/compact) + group
// Disabled: sort (built into UI), filter
// ────────────────────────────────────────────────────────────

export const BUDGET_CONTROLS: DataControlsConfig = {
  search: {
    placeholder: "Search budgets...",
    searchKeys: ["name"],
    collapsible: true,
  },

  sort: false,    // ← disabled: sorted by category order in UI
  filter: false,  // ← disabled: filter not needed here

  view: {
    modes: ["grid", "list", "compact"],
    defaultMode: "grid",
  },

  group: {
    defaultValue: "none",
    noneLabel: "No Grouping",
    fields: [
      { value: "category", label: "By Category" },
      { value: "status",   label: "By Status"   },
    ],
  },
};

// ────────────────────────────────────────────────────────────
// EXAMPLE 3: Simple Goals list
// Features: search only
// ────────────────────────────────────────────────────────────

export const SIMPLE_SEARCH_CONTROLS: DataControlsConfig = {
  search: {
    placeholder: "Search...",
    collapsible: false,
  },
  sort:   false,
  filter: false,
  view:   false,
  group:  false,
};

// ────────────────────────────────────────────────────────────
// EXAMPLE 4: Analytics page — sort + filter + group, no search
// ────────────────────────────────────────────────────────────

export const ANALYTICS_CONTROLS: DataControlsConfig = {
  search: false,  // ← disabled

  sort: {
    defaultValue: "value",
    defaultDirection: "desc",
    showDirection: true,
    fields: [
      { value: "value",    label: "Value" },
      { value: "growth",   label: "Growth %" },
      { value: "category", label: "Category" },
    ],
  },

  filter: {
    showChips: true,
    fields: [
      {
        key: "period",
        label: "Period",
        type: "select",
        options: [
          { value: "7d",  label: "Last 7 days"  },
          { value: "30d", label: "Last 30 days" },
          { value: "90d", label: "Last 3 months"},
          { value: "1y",  label: "Last year"    },
        ],
        defaultValue: "30d",
      },
      {
        key: "include_archived",
        label: "Archived Goals",
        type: "toggle",
        placeholder: "Include archived goals",
      },
    ],
  },

  view: false,

  group: {
    fields: [
      { value: "category", label: "By Category" },
      { value: "quarter",  label: "By Quarter"  },
    ],
  },
};

// ────────────────────────────────────────────────────────────
// HOW TO USE IN A PAGE:
// ────────────────────────────────────────────────────────────

/*

import { useDataControls, DataControlsBar } from "@/components/Shared/DataControls";
import { TRANSACTION_CONTROLS } from "@/components/Shared/DataControls/configs.example";

export default function TransactionPage() {
  const controls = useDataControls(myData, TRANSACTION_CONTROLS);

  return (
    <div>
      <IslandNavbar title="Transactions" ... />

      <div className="px-5 mt-4">
        <DataControlsBar
          config={TRANSACTION_CONTROLS}
          state={controls.state}
          activeFilterCount={controls.activeFilterCount}
          onSearchChange={controls.setSearch}
          onSortChange={controls.setSort}
          onFilterChange={controls.setFilter}
          onFiltersChange={controls.setFilters}
          onFiltersReset={controls.resetFilters}
          onViewChange={controls.setView}
          onGroupChange={controls.setGroup}
        />
      </div>

      <div className="px-5 mt-4">
        {controls.data.map((item) => (
          <TransactionCard key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
}

*/