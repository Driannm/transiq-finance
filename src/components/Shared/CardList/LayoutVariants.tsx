import { CardItemRenderResult, LayoutVariant } from "./types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function amountColor(type?: "expense" | "income" | "transfer"): string {
  if (type === "expense") return "text-red-500 dark:text-red-400";
  if (type === "income")  return "text-emerald-500 dark:text-emerald-400";
  return "text-gray-700 dark:text-gray-300";
}

// ─── Layout Renderers ─────────────────────────────────────────────────────────

export const LayoutRenderers: Record<
  LayoutVariant,
  (result: CardItemRenderResult, className?: string) => React.ReactNode
> = {

  // ── dashboard: 1 baris — [icon + text] | [amount] ───────────────────────
  dashboard: ({ left, right, meta }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {left}
      </div>
      <span className={`flex-shrink-0 text-sm font-semibold font-mono tabular-nums ${amountColor(meta?.type)}`}>
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {left}
        </div>
        <div className="flex-shrink-0 text-right ml-2">
          <p className={`text-sm font-semibold font-mono tabular-nums leading-tight ${amountColor(meta?.type)}`}>
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
      <div className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300">{left}</div>
      <span className={`flex-shrink-0 text-sm font-medium font-mono tabular-nums ${amountColor(meta?.type)}`}>
        {right}
      </span>
    </div>
  ),

  // ── minimal ──────────────────────────────────────────────────────────────
  minimal: ({ left, right, meta }) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0 text-xs text-gray-600 dark:text-gray-400">{left}</div>
      <span className={`flex-shrink-0 text-xs font-mono tabular-nums ${amountColor(meta?.type)}`}>
        {right}
      </span>
    </div>
  ),
};