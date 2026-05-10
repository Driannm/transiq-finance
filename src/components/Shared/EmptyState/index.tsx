// src/components/Shared/EmptyState/index.tsx
"use client";
import { ReactNode } from "react";
import { EmptyStateProps, EmptyStateAction } from "./types";

/**
 * Empty state component dengan support multiple actions.
 * Fully customizable dengan icon-only (no illustration slot).
 */
export function EmptyState({
  icon,
  title,
  description,
  variant = 'card',
  actions = [],
  action,
}: EmptyStateProps) {
  const allActions = [
    ...(action ?[action] :[]),
    ...actions
  ];
  const base = "px-4 py-10 text-center";
  const cardStyle =
    "bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800";

  const getButtonStyles = (variant: EmptyStateAction['variant'] = 'primary') => {
    const styles: Record<NonNullable<EmptyStateAction['variant']>, string> = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300",
      danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
    };
    return styles[variant];
  };

  return (
    <div className={`${base} ${variant === 'card' ? cardStyle : ''}`}>
      <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h4>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
        {description}
      </p>
      
      {/* Multiple actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onPress}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors active:scale-95 ${
                getButtonStyles(action.variant)
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}