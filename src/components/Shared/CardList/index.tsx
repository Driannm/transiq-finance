/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useCallback, isValidElement } from "react";
import { CardListProps, LayoutVariant } from "./types";
import { SwipeableCard } from "./SwipeActions";
import { LayoutRenderers } from "./LayoutVariants";
import { SkeletonItem } from "./SkeletonField";
import { GroupHeaderV2 as GroupHeader } from "./GroupHeader";
import { groupTransactionsWithSubtotal } from "../utils/groupBy";
import { EmptyState } from "../EmptyState";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Load More button — reused di grouped dan flat */
function LoadMoreButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress?: () => void;
}) {
  return (
    <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
      <button
        onClick={onPress}
        disabled={loading}
        className="
          w-full py-2.5 rounded-xl text-sm font-medium
          text-blue-600 dark:text-blue-400
          hover:bg-blue-50 dark:hover:bg-blue-950/30
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {loading ? "Memuat..." : "Muat Selengkapnya"}
      </button>
    </div>
  );
}

// ─── Shared card container styles ─────────────────────────────────────────────
// PENTING: tidak pakai overflow-hidden agar GroupHeader sticky bekerja.
// Gunakan overflow-clip untuk clip horizontal saja.

const CARD_BASE = `
  bg-white dark:bg-neutral-900
  rounded-2xl
  border border-gray-100 dark:border-neutral-800
`;

// ─── CardList ─────────────────────────────────────────────────────────────────

export function CardList<T = any>({
  items,
  layout = "dashboard",
  renderItem,
  keyExtractor,
  onItemPress,
  swipeActions = [],
  enableSwipe = true,
  layoutVariants = {},
  grouping,
  isLoading = false,
  skeleton = { fields: ["icon", "title", "subtitle", "amount"], count: 3 },
  emptyState,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  className = "",
  itemClassName = "",
}: CardListProps<T>) {
  // ── Grouping ───────────────────────────────────────────────────────────────
  const groupedData = useMemo(() => {
    if (!grouping?.enabled) return null;

    return groupTransactionsWithSubtotal(items as any[], {
      groupBy: grouping.groupBy as any,
      subtotalFormatter: grouping.subtotalFormatter,
      includeSign: true,
      amountExtractor: grouping.amountExtractor as any,
      typeExtractor: grouping.typeExtractor as any,
    });
  }, [items, grouping]);

  // ── Render single item ─────────────────────────────────────────────────────
  const renderCardItem = useCallback(
    (item: T, index: number) => {
      const key = keyExtractor(item, index);
      const renderResult = renderItem(item, layout);
      const LayoutRenderer = LayoutRenderers[layout];
      const extraClass = layoutVariants[layout]?.className ?? "";

      // LayoutRenderer sudah handle px/py internal — jangan wrap lagi dengan div berpadding
      const rendered = LayoutRenderer(renderResult);

      const content = (
        <div
          className={[
            "w-full hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors",
            extraClass,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onItemPress?.(item)}
          role={onItemPress ? "button" : undefined}
          tabIndex={onItemPress ? 0 : undefined}
          onKeyDown={
            onItemPress
              ? (e) => e.key === "Enter" && onItemPress(item)
              : undefined
          }
        >
          {rendered}
        </div>
      );

      if (enableSwipe && swipeActions.length > 0) {
        return (
          <SwipeableCard
            key={key}
            actions={swipeActions}
            itemId={key as string}
          >
            {content}
          </SwipeableCard>
        );
      }

      return <div key={key}>{content}</div>;
    },
    [
      layout,
      renderItem,
      layoutVariants,
      itemClassName,
      onItemPress,
      enableSwipe,
      swipeActions,
      keyExtractor,
    ]
  );

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading && skeleton) {
    return (
      <div
        className={[
          CARD_BASE,
          "divide-y divide-gray-100 dark:divide-neutral-800 overflow-clip",
          className,
        ].join(" ")}
      >
        {Array.from({ length: skeleton.count ?? 3 }).map((_, i) => (
          <SkeletonItem
            key={i}
            fields={skeleton.fields}
            variant={layout}
            className={itemClassName}
          />
        ))}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    if (!emptyState) return null;
    if (isValidElement(emptyState)) return <>{emptyState}</>;
    return <EmptyState {...(emptyState as any)} />;
  }

  // ── Grouped render ─────────────────────────────────────────────────────────
  // Tidak pakai overflow-hidden agar GroupHeader sticky bekerja.
  // Border-radius diterapkan via outline ring trick pada item pertama & terakhir.
  if (groupedData) {
    return (
      <div className={[CARD_BASE, "rounded-2xl", className].join(" ")}>
        {groupedData.map((group, gIdx) => (
          <div
            key={group.key}
            className={[
              gIdx < groupedData.length - 1
                ? "border-b border-gray-100 dark:border-neutral-800"
                : "",
            ].join("")}
          >
            <GroupHeader
              label={group.key}
              subtotal={group.subtotal}
              formattedSubtotal={group.formattedSubtotal}
              showSubtotal={grouping?.showSubtotal}
            />
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  className={
                    // ✅ Item terakhir di group terakhir dapat rounded bawah
                    gIdx === groupedData.length - 1 &&
                    idx === group.items.length - 1
                      ? "overflow-hidden rounded-b-2xl"
                      : ""
                  }
                >
                  {renderCardItem(item as T, idx)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {hasMore && (
          <LoadMoreButton loading={loadingMore} onPress={onLoadMore} />
        )}
      </div>
    );
  }

  // ── Flat render ────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        CARD_BASE,
        "divide-y divide-gray-100 dark:divide-neutral-800 overflow-hidden",
        className,
      ].join(" ")}
    >
      {items.map((item, index) => renderCardItem(item, index))}
      {hasMore && <LoadMoreButton loading={loadingMore} onPress={onLoadMore} />}
    </div>
  );
}

export default CardList;
