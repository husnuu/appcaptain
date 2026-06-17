import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Horizontal tab bar. Active tab uses the brand fill; the rest are light gray.
 * Keyboard accessible (arrow keys move focus between tabs).
 */
export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = items[(index + dir + items.length) % items.length];
    if (next) onChange(next.id);
  };

  return (
    <div role="tablist" className={cn("flex flex-wrap gap-2", className)}>
      {items.map((tab, i) => {
        const active = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-body-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
              active
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
