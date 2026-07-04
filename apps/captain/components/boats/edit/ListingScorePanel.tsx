"use client";

import {
  STEP_INFO_CARDS,
  calculateWizardListingScore,
  deriveCompletedWizardSteps,
  resolveStepInfoCardKey,
} from "@getyourboat/shared";
import type { FeatureSubTabId, OnboardingStep } from "@getyourboat/shared";
import type { SerializedBoat } from "../../../lib/types";
import { STEP_LABELS } from "../../../lib/onboarding";

interface ListingScorePanelProps {
  boat: SerializedBoat;
  activeStep: OnboardingStep | "PREVIEW";
  featureSubTab?: FeatureSubTabId;
}

export function ListingScorePanel({
  boat,
  activeStep,
  featureSubTab,
}: ListingScorePanelProps) {
  const completed = deriveCompletedWizardSteps(boat);
  const percent = calculateWizardListingScore(completed);
  const tip = STEP_INFO_CARDS[resolveStepInfoCardKey(activeStep, featureSubTab)];
  const activeLabel =
    activeStep === "PREVIEW"
      ? "Önizleme"
      : STEP_LABELS[activeStep as OnboardingStep];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_3px_rgba(26,26,46,0.06)]">
        {/* Score header */}
        <div className="px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Listing Score
              </p>
              <p className="mt-2 text-[13px] leading-snug text-gray-500">
                Şu an:{" "}
                <span className="font-medium text-ink">{activeLabel}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[2rem] font-bold tabular-nums leading-none tracking-tight text-ink">
                {percent}
                <span className="ml-0.5 text-base font-semibold text-gray-300">%</span>
              </p>
            </div>
          </div>

          <div
            className="mt-4 h-1 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-ink transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Aktif adım açıklaması — üst stepper ile tekrar olmaması için adım listesi kaldırıldı */}
        <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-4">
          <p className="text-[13px] font-semibold text-ink">{tip.title}</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">{tip.description}</p>
        </div>
      </div>
    </div>
  );
}
