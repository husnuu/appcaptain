"use client";

import { cn, FontAwesomeIcon, faCheck, type IconDefinition } from "@getyourboat/ui";

export interface StepperItem {
  id: string;
  label: string;
  icon?: IconDefinition;
  done: boolean;
  reachable: boolean;
  /** Tooltip shown when the step is locked (not reachable). */
  lockedHint?: string;
}

export function Stepper({
  items,
  currentId,
  onSelect,
}: {
  items: StepperItem[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1">
      {items.map((step, i) => {
        const isActive = step.id === currentId;
        return (
          <div key={step.id} className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={!step.reachable}
              title={!step.reachable ? step.lockedHint : undefined}
              onClick={() => step.reachable && onSelect(step.id)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition",
                isActive
                  ? "text-ink"
                  : step.reachable
                    ? "text-gray-500 hover:bg-gray-100/70"
                    : "cursor-not-allowed text-gray-300"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition",
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : step.done
                      ? "border border-brand-200 bg-brand-50 text-brand-600"
                      : step.reachable
                        ? "border border-gray-200 bg-white text-gray-400"
                        : "border border-gray-100 bg-gray-50 text-gray-300"
                )}
              >
                {step.icon ? (
                  <FontAwesomeIcon icon={step.icon} className="text-[14px]" aria-hidden />
                ) : step.done && !isActive ? (
                  <FontAwesomeIcon icon={faCheck} className="text-[12px]" aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
            </button>
            {i < items.length - 1 ? (
              <span aria-hidden className="mx-1 h-px w-5 shrink-0 bg-gray-200" />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
