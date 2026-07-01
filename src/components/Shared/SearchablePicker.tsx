/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "@/lib/iconMapping";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickerItem {
  id: string;
  name: string;
  group?: string;
  icon?: HugeIcon;
}

export interface SearchablePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: PickerItem | null) => void;
  items: PickerItem[];
  selectedId?: string;
  title: string;
  placeholder?: string;
  emptyText?: string;
  clearable?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupItems(
  items: PickerItem[]
): { group: string; items: PickerItem[] }[] {
  const map = new Map<string, PickerItem[]>();
  for (const item of items) {
    const key = item.group ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

const Chip = memo(function Chip({
  item,
  isSelected,
  onPress,
}: {
  item: PickerItem;
  isSelected: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(item.id)}
      style={{ touchAction: "manipulation" }}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "text-sm font-medium border transition-all duration-150 select-none active:scale-95",
        isSelected
          ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent"
          : [
              "bg-white dark:bg-neutral-800",
              "text-gray-700 dark:text-gray-300",
              "border-gray-200 dark:border-neutral-700",
              "hover:border-gray-400 dark:hover:border-neutral-500",
            ].join(" "),
      ].join(" ")}
    >
      {item.icon && (
        <HugeiconsIcon
          icon={item.icon}
          size={14}
          className={isSelected ? "opacity-90" : "opacity-50"}
        />
      )}
      {item.name}
    </button>
  );
});

// ─── SearchablePicker ─────────────────────────────────────────────────────────

export function SearchablePicker({
  open,
  onClose,
  onSelect,
  items,
  selectedId,
  title,
  placeholder = "Cari...",
  emptyText = "Tidak ada hasil yang cocok. Coba gunakan kata kunci lain atau periksa kembali ejaannya.",
  clearable = true,
}: SearchablePickerProps) {
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | undefined>(selectedId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset & focus saat sheet terbuka
  useEffect(() => {
    if (open) {
      setQuery("");
      setPendingId(selectedId);
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, selectedId]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => groupItems(filtered), [filtered]);
  const showLabels = useMemo(
    () =>
      grouped.length > 1 || (grouped.length === 1 && grouped[0].group !== ""),
    [grouped]
  );

  const handleChipPress = useCallback(
    (id: string) => {
      const next = pendingId === id ? undefined : id;
      const chosen = next ? items.find((i) => i.id === next) ?? null : null;
      setPendingId(next);
      onSelect(chosen);
      onClose();
    },
    [pendingId, items, onSelect, onClose]
  );

  const handleClear = useCallback(() => {
    setPendingId(undefined);
    onSelect(null);
    onClose();
  }, [onSelect, onClose]);

  return (
    <>
      {/* Smooth spring animation override untuk Sheet */}
      <style>{`
        [data-radix-popper-content-wrapper],
        [data-state="open"][data-vaul-drawer],
        [role="dialog"] {
          --sheet-transition: cubic-bezier(0.32, 0.72, 0, 1);
        }
        /* Override default Sheet border & ring */
        [data-slot="sheet-content"] {
          border: none !important;
          box-shadow: 0 -2px 40px rgba(0,0,0,0.18), 0 -1px 0px rgba(0,0,0,0.06) !important;
          outline: none !important;
        }
        /* Smooth slide-up animation */
        [data-slot="sheet-content"][data-state="open"] {
          animation: sheet-slide-up 0.38s cubic-bezier(0.32, 0.72, 0, 1) both !important;
        }
        [data-slot="sheet-content"][data-state="closed"] {
          animation: sheet-slide-down 0.28s cubic-bezier(0.4, 0, 1, 1) both !important;
        }
        @keyframes sheet-slide-up {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
        @keyframes sheet-slide-down {
          from { transform: translateY(0);    opacity: 1;   }
          to   { transform: translateY(100%); opacity: 0;   }
        }
        /* Overlay smooth fade */
        [data-slot="sheet-overlay"][data-state="open"] {
          animation: overlay-in 0.3s ease both !important;
        }
        [data-slot="sheet-overlay"][data-state="closed"] {
          animation: overlay-out 0.25s ease both !important;
        }
        @keyframes overlay-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlay-out { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        {/* 
          SheetContent with hideCloseButton (or closeButton={false}) to remove 
          the default X from Radix/shadcn. Also strip all default border styles.
        */}
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="
            rounded-t-[24px] px-0 pb-0
            flex flex-col max-h-[80vh]
            bg-white dark:bg-neutral-900
            border-0 ring-0 outline-none shadow-none
            focus:outline-none focus-visible:outline-none
          "
          // Belt-and-suspenders: inline style nukes any border the component adds
          style={{ border: "none", boxShadow: "0 -2px 40px rgba(0,0,0,0.2)" }}
        >
          {/* ── Header ── */}
          <SheetHeader className="px-4 pt-3 pb-0 flex-shrink-0">
            {/* Drag handle */}
            <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-neutral-700 mx-auto mb-3" />

            {/* Title row — single close button, no "+ New" button */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-3">
              {/* Kiri: close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="justify-self-start text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-0.5"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>

              {/* Tengah: title */}
              <SheetTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center px-2">
                {title}
              </SheetTitle>

              {/* Kanan: Hapus Pilihan */}
              {pendingId && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingId("");
                    onSelect(null);
                    onClose();
                  }}
                  className="absolute right-5 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Hapus Pilihan
                </button>
              )}
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="
                  w-full pl-9 pr-8 py-2.5 rounded-xl text-sm
                  bg-gray-100 dark:bg-neutral-800
                  text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-600
                  outline-none border border-transparent
                  focus:border-gray-200 dark:focus:border-neutral-700
                  transition-colors
                "
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Hapus pencarian"
                  style={{ touchAction: "manipulation" }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              )}
            </div>
          </SheetHeader>

          {/* ── Chip list ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-4 scrollbar-gutter-stable">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                  <HugeiconsIcon
                    icon={SearchRemoveIcon}
                    size={26}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </div>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tidak ada hasil ditemukan
                </h3>

                <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {emptyText}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {grouped.map(({ group, items: groupItems }) => (
                  <div key={group || "__default"}>
                    {showLabels && group && (
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
                        {group}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {groupItems.map((item) => (
                        <Chip
                          key={item.id}
                          item={item}
                          isSelected={item.id === pendingId}
                          onPress={handleChipPress}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
