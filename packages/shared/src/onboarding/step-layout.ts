import { OnboardingStep } from "../enums";
import { isLocationFieldKey } from "./feature-subtabs";

/**
 * Boat "rules" that read as house rules (not pricing) — surfaced under
 * "Tekne Kuralları" on the Açıklama (Description) step even though they are
 * seeded as booking_rule in the pricing section.
 */
const DESCRIPTION_RULE_FIELD_KEYS = new Set([
  "alcohol_allowed",
  "outside_food_drink_allowed",
]);

/** Maps a seeded field row to a wizard step. */
export function fieldToWizardStep(field: {
  key: string;
  type: string;
  sectionKey: string;
}): OnboardingStep | null {
  const { type, sectionKey, key } = field;

  if (sectionKey === "account_profile") return null;
  if (type === "profile_field") return null;

  if (sectionKey === "rental_type" || type === "rental_option") {
    return OnboardingStep.LISTING_MODEL;
  }

  if (type === "document" || sectionKey === "documents") {
    return OnboardingStep.DOCUMENTS;
  }

  if (type === "amenity" || sectionKey === "amenities") {
    return OnboardingStep.AMENITIES;
  }

  if (isLocationFieldKey(key)) {
    return OnboardingStep.LOCATION;
  }

  if (
    sectionKey === "boat_identity_and_specifications" ||
    sectionKey === "cabins" ||
    sectionKey === "bathrooms" ||
    sectionKey === "crew" ||
    type === "feature" ||
    type === "crew_option"
  ) {
    return OnboardingStep.BOAT_TYPE_FEATURES;
  }

  if (type === "media_description") {
    if (key === "boat_photos" || key === "video_upload" || key === "boat_plan") {
      return OnboardingStep.PHOTOS;
    }
    return OnboardingStep.DESCRIPTION_RULES;
  }

  if (type === "rule" || sectionKey === "rules_pets") {
    return OnboardingStep.DESCRIPTION_RULES;
  }

  // House rules live on the Description step, before falling through to pricing.
  if (DESCRIPTION_RULE_FIELD_KEYS.has(key)) {
    return OnboardingStep.DESCRIPTION_RULES;
  }

  if (
    type === "pricing_rule" ||
    type === "booking_rule" ||
    sectionKey === "booking_rules_and_pricing"
  ) {
    return OnboardingStep.PRICING;
  }

  return null;
}

export function getFieldsForWizardStep<
  T extends { key: string; type: string; sectionKey: string },
>(fields: T[], step: OnboardingStep): T[] {
  return fields.filter((f) => fieldToWizardStep(f) === step);
}
