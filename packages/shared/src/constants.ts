import { OnboardingStep } from "./enums";

/** Canonical onboarding step order, shared by API progress logic and the wizard. */
export const STEP_ORDER: OnboardingStep[] = [
  OnboardingStep.LISTING_MODEL,
  OnboardingStep.BOAT_TYPE_FEATURES,
  OnboardingStep.AMENITIES,
  OnboardingStep.DESCRIPTION_RULES,
  OnboardingStep.PHOTOS,
  OnboardingStep.PRICING,
  OnboardingStep.DOCUMENTS,
];

/** Amenities is optional; every other step is required before submitting. */
export const REQUIRED_STEPS: OnboardingStep[] = STEP_ORDER.filter(
  (s) => s !== OnboardingStep.AMENITIES
);

/** Supabase Storage bucket names. */
export const STORAGE_BUCKETS = {
  PHOTOS: "boat-photos",
  DOCUMENTS: "boat-documents",
} as const;

export function stepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

export interface ProgressState {
  completedSteps: OnboardingStep[];
  currentStep: OnboardingStep;
  isReadyForReview: boolean;
}

/**
 * Pure progress recomputation: given the already-completed steps and a step that
 * was just finished, returns the normalized completed list, the next incomplete
 * step, and whether all required steps are done. Shared so API and tooling agree.
 */
export function computeProgress(
  completedSteps: OnboardingStep[],
  justCompleted?: OnboardingStep
): ProgressState {
  const set = new Set<OnboardingStep>(completedSteps);
  if (justCompleted) set.add(justCompleted);
  const completed = STEP_ORDER.filter((s) => set.has(s));
  const currentStep =
    STEP_ORDER.find((s) => !set.has(s)) ?? OnboardingStep.DOCUMENTS;
  const isReadyForReview = REQUIRED_STEPS.every((s) => set.has(s));
  return { completedSteps: completed, currentStep, isReadyForReview };
}
