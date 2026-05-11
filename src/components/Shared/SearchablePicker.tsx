/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { HugeIcon } from "@/lib/iconMapping";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickerItem {
  id:     string;
  name:   string;
  group?: string;
  icon?:  HugeIcon;
}

export interface SearchablePickerProps {
  open:         boolean;
  onClose:      () => void;
  onSelect:     (item: PickerItem | null) => void;
  items:        PickerItem[];
  selectedId?:  string;
  title:        string;
  placeholder?: string;
  emptyText?:   string;
  clearable?:   boolean;
  onClickNew?:  () => void;
  newLabel?:    string;
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
  item:       PickerItem;
  isSelected: boolean;
  onPress:    (id: string) => void;
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
  placeholder = "Search...",
  emptyText   = "Tidak ditemukan",
  clearable   = true,
  onClickNew,
  newLabel    = "New",
}: SearchablePickerProps) {
  const [query,     setQuery]     = useState("");
  const [pendingId, setPendingId] = useState<string | undefined>(selectedId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset & focus saat sheet terbuka
  useEffect(() => {
    if (open) {
      setQuery("");
      setPendingId(selectedId);
      
      // Using a requestAnimationFrame or a slight timeout for focus is 
      // standard practice for Modals/Sheets to ensure the element is mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, selectedId]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.group?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped     = useMemo(() => groupItems(filtered), [filtered]);
  // Hanya tampilkan label grup jika ada lebih dari 1 grup,
  // atau jika 1 grup tersebut punya nama eksplisit
  const showLabels  = useMemo(
    () => grouped.length > 1 || (grouped.length === 1 && grouped[0].group !== ""),
    [grouped]
  );

  // Chip press — satu tap selesai
  const handleChipPress = useCallback(
    (id: string) => {
      const next   = pendingId === id ? undefined : id;
      const chosen = next ? (items.find((i) => i.id === next) ?? null) : null;
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
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="
          rounded-t-[20px] px-0 pb-0
          flex flex-col max-h-[80vh]
          bg-white dark:bg-neutral-900
          border-0 focus:outline-none
        "
      >
        {/* ── Header ── */}
        <SheetHeader className="px-4 pt-3 pb-0 flex-shrink-0">
          {/* Drag handle */}
          <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-neutral-700 mx-auto mb-3" />

          {/* Title row — gunakan grid agar title selalu center tanpa absolute */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-3">
            {/* Kiri: close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="justify-self-start text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Tengah: title — tidak akan tumpang tindih */}
            <SheetTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center px-2">
              {title}
            </SheetTitle>

            {/* Kanan: new button atau spacer */}
            <div className="justify-self-end">
              {onClickNew ? (
                <button
                  type="button"
                  onClick={() => { onClose(); onClickNew(); }}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
                >
                  <HugeiconsIcon icon={Add01Icon} size={13} />
                  {newLabel}
                </button>
              ) : (
                <div className="w-[18px]" />
              )}
            </div>
          </div>

          {/* Search bar — wrapper div tidak perlu pb, cukup mb di bawah */}
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </SheetHeader>

        {/* ── Chip list ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-4 scrollbar-gutter-stable">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-600 py-10">
              {emptyText}
            </p>
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

        {/* ── Clear footer ── */}
        {clearable && pendingId && (
          <div className="flex-shrink-0 px-4 pt-2 border-t border-gray-100 dark:border-neutral-800"
               style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={handleClear}
              style={{ touchAction: "manipulation" }}
              className="
                w-full py-3 rounded-2xl text-sm font-medium transition-colors
                text-gray-500 dark:text-gray-400
                bg-gray-100 dark:bg-neutral-800
                hover:bg-gray-200 dark:hover:bg-neutral-700
                active:scale-[0.98]
              "
            >
              Hapus pilihan
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}