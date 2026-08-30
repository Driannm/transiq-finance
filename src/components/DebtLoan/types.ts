// components/loans/add-loan/types.ts

export type CardItem = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export type ObligationCategory = "personal" | "family" | "colleague" | "credit_card" | "bank" | "other";

/**
 * Distinct fetch states for the source-account list.
 * Previously the page only tracked `cards.length === 0` to mean "loading",
 * which meant a failed fetch and an empty account list rendered identically.
 */
export type CardsFetchState = "loading" | "success" | "error";

export type FormErrors = Partial<
  Record<
    "personName" | "name" | "cardId" | "amount" | "startDate" | "dueDate",
    string
  >
>;
