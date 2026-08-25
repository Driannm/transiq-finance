import React from "react";
import { CardItemRenderResult, LayoutVariant, LoanItemMeta } from "./types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  UserIcon,
  UserGroupIcon,
  Briefcase01Icon,
  ClipboardIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function amountColor(type?: "expense" | "income" | "transfer"): string {
  if (type === "expense") return "text-red-500 dark:text-red-400";
  if (type === "income") return "text-emerald-500 dark:text-emerald-400";
  return "text-gray-700 dark:text-gray-300";
}

// ── Loan variant helpers ──────────────────────────────────────────────────────

const LOAN_CATEGORY_ICON = {
  personal: UserIcon,
  family: UserGroupIcon,
  colleague: Briefcase01Icon,
  other: ClipboardIcon,
} as const;

const LOAN_STATUS_META = {
  active: {
    label: "Belum Bayar",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20 dark:border-blue-500/25",
  },
  ongoing: {
    label: "Dicicil",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 dark:border-amber-500/25",
  },
  overdue: {
    label: "Jatuh Tempo",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/15 border-red-500/20 dark:border-red-500/25",
  },
  paid: {
    label: "Lunas",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/25",
  },
} as const;

const LOAN_STAMP_META = {
  active: {
    label: "Belum Bayar",
    border: "border-blue-500/50 dark:border-blue-400/50",
    text: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/5",
    rotate: "-rotate-6",
  },
  ongoing: {
    label: "Dicicil",
    border: "border-amber-500/55 dark:border-amber-400/55",
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/5",
    rotate: "-rotate-3",
  },
  overdue: {
    label: "Jatuh Tempo",
    border: "border-red-500/60 dark:border-red-400/60",
    text: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/5",
    rotate: "-rotate-12",
  },
  paid: {
    label: "Lunas",
    border: "border-emerald-600/70 dark:border-emerald-400/70",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/10",
    rotate: "-rotate-12 scale-110",
  },
} as const;

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── LoanCard renderer ────────────────────────────────────────────────────────
// Called from CardList when variant='loan'. Uses meta.loan (LoanItemMeta).

function LoanCard({ result }: { result: CardItemRenderResult }) {
  const loan = result.meta?.loanData as LoanItemMeta | undefined;

  if (!loan) {
    // fallback: generic row (should not happen when used correctly)
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">{result.left}</div>
        <span className="flex-shrink-0 text-sm font-semibold font-mono">
          {result.right}
        </span>
      </div>
    );
  }

  const stamp = LOAN_STAMP_META[loan.status];
  const isPaid = loan.status === "paid";
  const categoryIcon = LOAN_CATEGORY_ICON[loan.category] ?? ClipboardIcon;

  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 border border-gray-150/70 dark:border-neutral-800 rounded-3xl p-5 shadow-xs transition-all hover:shadow-sm cursor-pointer",
        isPaid ? "space-y-0" : "space-y-4",
      )}
    >
      {/* ── Top Row: Icon, Title & Status + Remaining ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon, Title, Debtor */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-gray-100/50 dark:border-neutral-800 flex items-center justify-center flex-shrink-0 select-none text-gray-550 dark:text-gray-400">
            <HugeiconsIcon
              icon={categoryIcon}
              size={20}
              className="flex-shrink-0"
            />
          </div>
          <div className="min-w-0">
            <h4
              className={cn(
                "font-bold text-sm leading-snug truncate",
                isPaid
                  ? "text-gray-400 dark:text-gray-500 font-medium"
                  : "text-gray-905 dark:text-gray-100",
              )}
            >
              {result.left}
            </h4>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className="text-xs text-gray-555 dark:text-gray-400">
                Debitur:
              </span>
              <span
                className={cn(
                  "text-xs font-semibold truncate max-w-[80px] xs:max-w-[124px] sm:max-w-none",
                  isPaid
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-900 dark:text-gray-100 font-bold",
                )}
              >
                {loan.debtor}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount + Status Stamp */}
        <div className="text-right flex-shrink-0 flex flex-col items-end justify-center select-none">
          {!isPaid ? (
            <>
              <p className="hidden xs:block text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-550 leading-none">
                Sisa Piutang
              </p>
              <p className="text-xs xs:text-sm font-extrabold font-mono text-gray-955 dark:text-white mt-0.5 sm:mt-1 leading-none">
                IDR {formatIDR(loan.remaining)}
              </p>
            </>
          ) : (
            <>
              <p className="hidden xs:block text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-650 leading-none">
                Total Piutang
              </p>
              <p className="text-xs xs:text-sm font-semibold font-mono text-gray-400 dark:text-gray-550 mt-0.5 sm:mt-1 leading-none">
                IDR {formatIDR(loan.totalAmount)}
              </p>
            </>
          )}
          {/* Status stamp */}
          <div className="relative mt-2 flex items-center justify-end pr-0.5">
            <span
              className={cn(
                "inline-block px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold tracking-widest border-2 rounded uppercase font-mono shadow-xs select-none",
                stamp.border,
                stamp.text,
                stamp.bg,
                stamp.rotate,
              )}
              style={{
                transformOrigin: "right center",
                textShadow: "0.5px 0.5px 0.5px rgba(0,0,0,0.05)",
              }}
            >
              {stamp.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress + Due Date + Action (hidden when paid) ── */}
      {!isPaid && (
        <>
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-555 dark:text-gray-400 font-semibold">
              <span>Terbayar: {loan.progressPercent}%</span>
              <span className="hidden sm:inline text-gray-400 dark:text-gray-550">
                Total: IDR {formatIDR(loan.totalAmount)}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${loan.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-t border-gray-100 dark:border-neutral-800" />

          {/* Due date + Record Payment */}
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-405 dark:text-gray-455 font-medium">
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={14}
                className="text-gray-350 dark:text-gray-600 flex-shrink-0"
              />
              <span>
                <span className="hidden xs:inline">Jatuh Tempo: </span>
                {safeFormatDate(loan.dueDate)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loan.onRecordPayment?.();
              }}
              className="px-3.5 py-1 sm:px-4.5 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-455 border border-emerald-200/10 dark:border-emerald-500/10 rounded-full transition-colors shadow-xs"
            >
              Record Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Layout Renderers ─────────────────────────────────────────────────────────

export const LayoutRenderers: Record<
  LayoutVariant,
  (result: CardItemRenderResult, className?: string) => React.ReactNode
> = {
  // ── dashboard: 1 baris — [icon + text] | [amount] ───────────────────────
  dashboard: ({ left, right, meta }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">{left}</div>
      <span
        className={`flex-shrink-0 text-sm font-semibold font-mono tabular-nums ${amountColor(meta?.type)}`}
      >
        {right}
      </span>
    </div>
  ),

  // ── detailed ─────────────────────────────────────────────────────────────
  // left = <> <icon 40px/> <textblock flex-1/> </>  — sudah dari caller
  // Baris 1: flex row [ left(icon+text) | amount+date ]
  // Baris 2: notes   (indent 52px = icon40 + gap12)
  // Baris 3: badge   (indent 52px)
  detailed: ({ left, right, bottom, meta }) => (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* left sudah berisi icon + textblock dalam fragment — wrap flex agar horizontal */}
        <div className="flex items-center gap-3 min-w-0 flex-1">{left}</div>
        <div className="flex-shrink-0 text-right ml-2">
          <p
            className={`text-sm font-semibold font-mono tabular-nums leading-tight ${amountColor(meta?.type)}`}
          >
            {right}
          </p>
          {meta?.date && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
              {meta.date}
            </p>
          )}
        </div>
      </div>
      {bottom && (
        <p className="mt-1.5 pl-[52px] text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">
          {bottom}
        </p>
      )}
      {meta?.badge && (
        <div className="mt-1.5 pl-[52px]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            {meta.badge}
          </span>
        </div>
      )}
    </div>
  ),

  // ── compact ──────────────────────────────────────────────────────────────
  compact: ({ left, right, meta }) => (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300">
        {left}
      </div>
      <span
        className={`flex-shrink-0 text-sm font-medium font-mono tabular-nums ${amountColor(meta?.type)}`}
      >
        {right}
      </span>
    </div>
  ),

  // ── minimal ──────────────────────────────────────────────────────────────
  minimal: ({ left, right, meta }) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0 text-xs text-gray-600 dark:text-gray-400">
        {left}
      </div>
      <span
        className={`flex-shrink-0 text-xs font-mono tabular-nums ${amountColor(meta?.type)}`}
      >
        {right}
      </span>
    </div>
  ),

  // ── loan: standalone card per item ───────────────────────────────────────
  loan: (result) => <LoanCard result={result} />,
};
