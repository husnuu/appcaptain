import { Check } from "lucide-react";
import { cn } from "../lib/cn";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Vertical checklist. Completed items show a filled success tick; incomplete
 * items show an empty gray circle. Optionally selectable (e.g. Listing Score).
 */
export function Checklist({ items, activeId, onSelect, className }: ChecklistProps) {
  return (
    <ul className={cn("space-y-1", className)}>
      {items.map((item) => {
        const inner = (
          <>
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                item.done
                  ? "border-success-500 bg-success-500 text-white"
                  : "border-gray-300 text-transparent"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span
              className={cn(
                "text-body-sm",
                item.done ? "font-medium text-gray-900" : "text-gray-500"
              )}
            >
              {item.label}
            </span>
          </>
        );

        return (
          <li key={item.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50",
                  activeId === item.id && "bg-gray-100"
                )}
              >
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
