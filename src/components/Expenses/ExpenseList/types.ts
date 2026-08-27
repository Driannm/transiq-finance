// src/components/Expenses/ExpenseList/types.ts

export interface ExpenseTransaction {
  id:        string;
  amount:    number;
  date:      string;
  createdAt: string;
  card:      { id: string; name: string; type: string };
  groups?:   { group: { id: string; name: string; icon: string; iconColor: string } }[];
}

export interface ExpenseRecord {
  id:        string;
  name:      string;
  tax:       number;
  fee:       number;
  discount:  number;
  notes?:    string | null;
  category?: { id: string; name: string } | null;
  merchant?: { id: string; name: string } | null;
  transaction: ExpenseTransaction;
}

export interface ExpenseGroupMeta {
  id:        string;
  name:      string;
  icon:      string;
  iconColor: string;
}

// ─── Display item union ───────────────────────────────────────────────────────
// Items rendered in the list are either a single expense or a collapsible group.

export type ExpenseDisplayItem =
  | {
      id:          string;
      isGroup:     false;
      expense:     ExpenseRecord;
      transaction: ExpenseTransaction;
    }
  | {
      id:          string;
      isGroup:     true;
      group:       ExpenseGroupMeta;
      expenses:    ExpenseRecord[];
      transaction: { amount: number; date: string };
    };

// ─── Date group (groupedData) ─────────────────────────────────────────────────

export interface ExpenseDateGroup {
  key:   string;  // e.g. "Hari ini", "Kemarin", "Senin, 15 Agustus"
  total: number;
  items: ExpenseDisplayItem[];
}
