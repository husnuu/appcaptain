"use client";

import { cn } from "@getyourboat/ui";
import { STEP_LABELS, STEP_ORDER, stepIndex } from "../../lib/onboarding";
import type { OnboardingStep } from "../../lib/types";

export function Stepper({
  current,
  completed,
  onSelect,
}: {
  current: OnboardingStep;
  completed: OnboardingStep[];
  onSelect: (step: OnboardingStep) => void;
}) {
  const currentBoatStep = completed.length
    ? STEP_ORDER.find((s) => !completed.includes(s)) ?? "DOCUMENTS"
    : "LISTING_MODEL";
  const furthest = Math.max(stepIndex(currentBoatStep), ...completed.map(stepIndex), 0);

  return (
    <nav className="flex flex-wrap gap-2">
      {STEP_ORDER.map((step, i) => {
        const isDone = completed.includes(step);
        const isActive = step === current;
        const reachable = i <= furthest;
        return (
          <button
            key={step}
            disabled={!reachable}
            onClick={() => reachable && onSelect(step)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "border-brand-600 bg-brand-600 text-white"
                : isDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : reachable
                    ? "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                isActive
                  ? "bg-white/20"
                  : isDone
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-slate-100"
              )}
            >
              {isDone ? "✓" : i + 1}
            </span>
            {STEP_LABELS[step]}
          </button>
        );
      })}
    </nav>
  );
}
