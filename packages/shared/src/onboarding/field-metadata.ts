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

/** Belgede çelişkili veya bilinçli opsiyonel tutulan alanlar — pakette olsa da zorunlu sayılmaz. */
export const ALWAYS_OPTIONAL_FIELD_KEYS = new Set<string>([
  "boat_plan",
  // Kabin + Tuvalet: 0 değeri geçerli olduğundan zorunlu tutulmaz.
  "total_toilets_just_for_customers",
  "crew_members_included_in_the_price",
  "number_of_crew_members",
]);

/**
 * Donanım kategorileri "ekstra ücretli" olarak işaretlenemez. Güvenlik ekipmanı
 * (can yeleği, ilk yardım, EPIRB…), navigasyon (GPS, VHF, autopilot…) ve güverte
 * ekipmanları standart kabul edilir; bunları ekstra ücrete tabi tutmak yanlış.
 * Yeni bir kategori eklenirse buraya key'i eklemek yeterli.
 */
export const NO_EXTRA_AMENITY_CATEGORY_KEYS = new Set<string>([
  "deck",
  "security",
  "navigation",
]);

export function amenityCategoryAllowsExtra(categoryKey: string): boolean {
  return !NO_EXTRA_AMENITY_CATEGORY_KEYS.has(categoryKey);
}

/** Evcil hayvan politikası — birbirini dışlayan tek seçim (radio). */
export const PET_POLICY_FIELD_KEYS = [
  "not_permitted",
  "welcome_at_additional_charge",
  "welcome_at_no_additional_charge",
] as const;

/** Kaptana gösterilen Türkçe evcil hayvan politikası seçenek metinleri. */
export const PET_POLICY_LABELS: Record<(typeof PET_POLICY_FIELD_KEYS)[number], string> = {
  not_permitted: "Kabul edilmiyor",
  welcome_at_additional_charge: "Ek ücretle kabul ediliyor",
  welcome_at_no_additional_charge: "Ücretsiz kabul ediliyor",
};
