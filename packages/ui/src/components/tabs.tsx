import * as React from "react";
import { cn } from "../lib/cn";
import { FontAwesomeIcon, type IconDefinition } from "../icons";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconDefinition;
  badge?: React.ReactNode;
  /** When true the tab is locked: shown dimmed and cannot be selected. */
  disabled?: boolean;
  /** Tooltip shown on a locked tab explaining what to complete first. */
  lockedHint?: string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Called when a locked (disabled) tab is clicked, so the parent can warn. */
  onLockedClick?: (id: string) => void;
  className?: string;
}

/**
 * Horizontal tab bar. Active tab uses the brand fill; the rest are light gray.
 * Keyboard accessible (arrow keys move focus between tabs).
 */
export function Tabs({ items, activeId, onChange, onLockedClick, className }: TabsProps) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    // Skip over locked tabs when navigating with the keyboard.
    for (let step = 1; step <= items.length; step++) {
      const next = items[(index + dir * step + items.length * step) % items.length];
      if (next && !next.disabled) {
        onChange(next.id);
        return;
      }
    }
  };

  return (
    <div role="tablist" className={cn("flex flex-wrap gap-2", className)}>
      {items.map((tab, i) => {
        const active = tab.id === activeId;
        const locked = !!tab.disabled;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-disabled={locked}
            title={locked ? tab.lockedHint : undefined}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => {
              if (locked) {
                onLockedClick?.(tab.id);
                return;
              }
              onChange(tab.id);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-body-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
              locked
                ? "cursor-not-allowed bg-gray-100 text-gray-400 opacity-40"
                : active
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {tab.icon ? (
              <FontAwesomeIcon icon={tab.icon} className="text-[14px]" aria-hidden />
            ) : null}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
