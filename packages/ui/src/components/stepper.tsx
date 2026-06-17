import { Check } from "lucide-react";
import { cn } from "../lib/cn";

export interface StepperItem {
  id: string;
  label: string;
  done?: boolean;
  reachable?: boolean;
}

export interface StepperProps {
  steps: StepperItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Horizontal numbered stepper. Completed steps show a tick, the active step is
 * highlighted in brand color, unreachable steps are disabled.
 */
export function Stepper({ steps, activeId, onSelect, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-2 overflow-x-auto", className)}>
      {steps.map((step, i) => {
        const active = step.id === activeId;
        const reachable = step.reachable ?? true;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!reachable && !active}
              onClick={() => onSelect?.(step.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-body-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                onSelect && (reachable || active) && "hover:bg-gray-100"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-caption font-semibold",
                  active
                    ? "border-brand-500 bg-brand-500 text-white"
                    : step.done
                      ? "border-success-500 bg-success-500 text-white"
                      : "border-gray-300 text-gray-500"
                )}
              >
                {step.done && !active ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap font-medium",
                  active ? "text-ink" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 ? (
              <span aria-hidden className="h-px w-6 bg-gray-300" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
