import type { OnboardingFieldDTO } from "../dto/onboarding";
import { getFeatureFieldLabel } from "./feature-labels";

export interface FieldBehavior {
  /** Captain-facing form renders this field. */
  ownerInput: boolean;
  /** Shown on customer preview / public listing. */
  customerVisible: boolean;
  /** Override label shown in forms. */
  labelOverride?: string;
  /** Special UI / validation behaviour. */
  special?: "crew_optional_toggle" | "fuel_contact_flag" | "boat_plan_todo";
}

/** Per-field behaviour overrides from the requirements PDF notes. */
export const FIELD_BEHAVIOR: Record<string, FieldBehavior> = {
  boat_type_sailboat_motor_gulet_etc: { ownerInput: false, customerVisible: false },
  skipper: { ownerInput: false, customerVisible: true },
  number_of_crew_members: {
    ownerInput: true,
    customerVisible: true,
    special: "crew_optional_toggle",
  },
  fuel_cost: {
    ownerInput: true,
    customerVisible: true,
    special: "fuel_contact_flag",
  },
  hot_water: {
    ownerInput: true,
    customerVisible: true,
    labelOverride: "Hot Drinking Water",
  },
  boat_plan: {
    ownerInput: true,
    customerVisible: true,
    special: "boat_plan_todo",
  },
  crew_members_included_in_the_price: {
    ownerInput: true,
    customerVisible: true,
  },
  /** Covered by `approvalType` on step 1 (Kiralama Modeli). */
  instant_booking: { ownerInput: false, customerVisible: false },
  confirmation_required: { ownerInput: false, customerVisible: false },
  latitude: { ownerInput: false, customerVisible: false },
  longitude: { ownerInput: false, customerVisible: false },
  address: { ownerInput: false, customerVisible: true },
};

export function getFieldBehavior(key: string): FieldBehavior {
  return FIELD_BEHAVIOR[key] ?? { ownerInput: true, customerVisible: true };
}

export function getFieldLabel(field: Pick<OnboardingFieldDTO, "key" | "label">): string {
  const override = FIELD_BEHAVIOR[field.key]?.labelOverride;
  if (override) return override;
  return getFeatureFieldLabel(field);
}

export function isOwnerInputField(key: string): boolean {
  return getFieldBehavior(key).ownerInput;
}
