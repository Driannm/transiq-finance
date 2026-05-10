import { LayoutVariant } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SkeletonFieldType =
  | "icon"
  | "title"
  | "subtitle"
  | "amount"
  | "date"
  | "badge"
  | "bottom";

interface SkeletonFieldProps {
  type:      SkeletonFieldType;
  variant?:  LayoutVariant;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────
// Setiap ukuran harus match actual rendered content di LayoutVariants

const SIZES: Record<LayoutVariant, Partial<Record<SkeletonFieldType, string>>> = {
  dashboard: {
    icon:     "w-9 h-9 rounded-xl",
    title:    "h-[14px] w-28",
    subtitle: "h-3 w-20",
    amount:   "h-[14px] w-14",
    date:     "",            // tidak ada di dashboard
    badge:    "",
    bottom:   "",
  },
  detailed: {
    icon:     "w-10 h-10 rounded-xl",
    title:    "h-[14px] w-32",
    subtitle: "h-3 w-24",
    amount:   "h-[14px] w-16",
    date:     "h-3 w-12",
    badge:    "h-5 w-16 rounded-full",
    bottom:   "h-3 w-40",
  },
  compact: {
    icon:     "",
    title:    "h-3 w-24",
    subtitle: "",
    amount:   "h-3 w-12",
    date:     "",
    badge:    "",
    bottom:   "",
  },
  minimal: {
    icon:     "",
    title:    "h-3 w-20",
    subtitle: "",
    amount:   "h-3 w-10",
    date:     "",
    badge:    "",
    bottom:   "",
  },
};

// ─── SkeletonField ────────────────────────────────────────────────────────────

export function SkeletonField({
  type,
  variant = "dashboard",
  className = "",
}: SkeletonFieldProps) {
  const sizeClass = SIZES[variant]?.[type];
  if (!sizeClass) return null;

  return (
    <div
      className={[
        "animate-pulse rounded bg-gray-200 dark:bg-neutral-800",
        sizeClass,
        className,
      ].join(" ")}
    />
  );
}

// ─── SkeletonItem ─────────────────────────────────────────────────────────────
// Layout harus match persis dengan LayoutVariants

export function SkeletonItem({
  fields,
  variant = "dashboard",
  className = "",
}: {
  fields:   SkeletonFieldType[];
  variant?: LayoutVariant;
  className?: string;
}) {
  const has = (f: SkeletonFieldType) => fields.includes(f);

  // ── detailed ────────────────────────────────────────────────────────────────
  if (variant === "detailed") {
    return (
      <div className={["px-4 py-3 space-y-2", className].join(" ")}>
        {/* Baris 1: icon + title/subtitle + amount/date */}
        <div className="flex items-start gap-3">
          {has("icon") && <SkeletonField type="icon" variant={variant} />}
          <div className="flex-1 space-y-2 min-w-0">
            {has("title")    && <SkeletonField type="title"    variant={variant} />}
            {has("subtitle") && <SkeletonField type="subtitle" variant={variant} />}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {has("amount") && <SkeletonField type="amount" variant={variant} />}
            {has("date")   && <SkeletonField type="date"   variant={variant} />}
          </div>
        </div>
        {/* Baris 2: bottom note */}
        {has("bottom") && (
          <div className="pl-[52px]">
            <SkeletonField type="bottom" variant={variant} />
          </div>
        )}
        {/* Badge */}
        {has("badge") && (
          <div className="pl-[52px]">
            <SkeletonField type="badge" variant={variant} />
          </div>
        )}
      </div>
    );
  }

  // ── compact / minimal ───────────────────────────────────────────────────────
  if (variant === "compact" || variant === "minimal") {
    const py = variant === "compact" ? "py-2.5" : "py-2";
    return (
      <div className={["flex items-center justify-between px-4", py, className].join(" ")}>
        {has("title")  && <SkeletonField type="title"  variant={variant} />}
        {has("amount") && <SkeletonField type="amount" variant={variant} />}
      </div>
    );
  }

  // ── dashboard (default) ─────────────────────────────────────────────────────
  return (
    <div className={["flex items-center justify-between px-4 py-3", className].join(" ")}>
      <div className="flex items-center gap-3">
        {has("icon") && <SkeletonField type="icon" variant={variant} />}
        <div className="space-y-2">
          {has("title")    && <SkeletonField type="title"    variant={variant} />}
          {has("subtitle") && <SkeletonField type="subtitle" variant={variant} />}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {has("amount") && <SkeletonField type="amount" variant={variant} />}
        {has("date")   && <SkeletonField type="date"   variant={variant} />}
      </div>
    </div>
  );
}