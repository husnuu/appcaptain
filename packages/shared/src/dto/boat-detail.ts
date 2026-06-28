import type { SerializedBoatDTO } from "./onboarding";
import { ApprovalType } from "../enums";
import {
  getFieldBehavior,
  getFieldLabel,
  getListingModelPriceLabel,
  INCLUDED_FEE_FIELD_GROUPS,
  LOCATION_FIELD_KEYS,
  LOCATION_FORM_FIELD_KEYS,
  PRICING_FIELD_LABELS,
  readIncludedFeePair,
} from "../onboarding";

/**
 * Customer-facing boat detail view model. This is the single shape the public
 * `BoatDetailView` (packages/ui) renders — fed by the API on apps/web, or by
 * the captain wizard's current boat state for the in-panel preview.
 */
export interface BoatDetailGalleryImage {
  url: string;
  alt: string;
}

export interface BoatDetailHighlight {
  label: string;
  value: string;
}

export interface BoatDetailStat {
  label: string;
  value: string;
}

export interface BoatDetailPolicyLine {
  label: string;
  value: string;
}

export interface BoatDetailAmenity {
  label: string;
  isExtra: boolean;
  extraPrice: number | null;
  currency: string | null;
}

export interface BoatDetailPrice {
  label: string;
  price: number;
  currency: string;
}

export interface BoatDetailLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  marina: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  /** Human-readable single line for the booking box. */
  summary: string | null;
}

export interface BoatDetailViewModel {
  title: string;
  /** Brand · model line under the title. */
  subtitle: string | null;
  boatTypeLabel: string | null;
  gallery: BoatDetailGalleryImage[];
  stats: BoatDetailStat[];
  specs: BoatDetailHighlight[];
  highlights: BoatDetailHighlight[];
  description: string | null;
  amenities: BoatDetailAmenity[];
  pricing: BoatDetailPrice[];
  /** Free-text rules from description step or boat_rules_and_policies. */
  rules: string | null;
  policyLines: BoatDetailPolicyLine[];
  depositLabel: string | null;
  cancellationLabel: string | null;
  approvalLabel: string | null;
  documentBadges: string[];
  location: BoatDetailLocation | null;
  boatPlanUrl: string | null;
  contactForFuelCost: boolean;
  fuelCostNote: string | null;
}

const DEPOSIT_LABELS: Record<string, string> = {
  percent_20: "%20 ön ödeme",
  percent_50: "%50 ön ödeme",
  full: "Tam ödeme",
};

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: "Esnek iptal",
  moderate: "Orta iptal",
  strict: "Katı iptal",
};

const STAT_FIELDS: { key: string; label: string; suffix: string }[] = [
  { key: "capacity", label: "Kapasite", suffix: " kişi" },
  {
    key: "number_of_cabins_for_customer_without_crew",
    label: "Kabin",
    suffix: " kabin",
  },
  {
    key: "total_toilets_just_for_customers",
    label: "Tuvalet",
    suffix: " tuvalet",
  },
  { key: "length_ft_m", label: "Uzunluk", suffix: " m" },
];

const SPEC_EXCLUDE_KEYS = new Set([
  ...STAT_FIELDS.map((s) => s.key),
  ...LOCATION_FIELD_KEYS,
  "boat_plan",
  "manufacturer_brand",
  "model",
  "boat_name",
]);

const POLICY_RULE_KEYS = [
  "check_in",
  "check_out",
  "check_in_time_day_rental",
  "check_out_time_day_rental",
  "min_rental_duration",
  "weekly_check_in_out_day",
  "daily_a_c_usage",
] as const;

function featureMap(boat: SerializedBoatDTO): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of boat.features) {
    const value = f.value?.trim();
    if (value) map.set(f.key, value);
  }
  return map;
}

function readLocation(boat: SerializedBoatDTO): BoatDetailLocation | null {
  const byKey = featureMap(boat);
  const parts = LOCATION_FORM_FIELD_KEYS.map((k) => byKey.get(k)).filter(Boolean) as string[];
  const latRaw = byKey.get("latitude");
  const lngRaw = byKey.get("longitude");
  const latitude = latRaw ? Number.parseFloat(latRaw) : null;
  const longitude = lngRaw ? Number.parseFloat(lngRaw) : null;
  const hasCoords =
    latitude != null && !Number.isNaN(latitude) && longitude != null && !Number.isNaN(longitude);
  if (parts.length === 0 && !hasCoords && !byKey.get("address")) return null;
  return {
    country: byKey.get("country") ?? null,
    region: byKey.get("region") ?? null,
    city: byKey.get("city") ?? null,
    marina: byKey.get("marina") ?? null,
    latitude: hasCoords ? latitude : null,
    longitude: hasCoords ? longitude : null,
    address: byKey.get("address") ?? null,
    summary: byKey.get("address") ?? (parts.length > 0 ? parts.join(", ") : null),
  };
}

function readSubtitle(features: Map<string, string>): string | null {
  const brand = features.get("manufacturer_brand");
  const model = features.get("model");
  const parts = [brand, model].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function readStats(features: Map<string, string>): BoatDetailStat[] {
  const stats: BoatDetailStat[] = [];
  for (const field of STAT_FIELDS) {
    const raw = features.get(field.key);
    if (!raw) continue;
    stats.push({
      label: field.label,
      value: `${raw}${field.suffix}`,
    });
  }
  return stats;
}

function readSpecs(boat: SerializedBoatDTO): BoatDetailHighlight[] {
  return boat.features
    .filter((f) => {
      if (SPEC_EXCLUDE_KEYS.has(f.key)) return false;
      const behavior = getFieldBehavior(f.key);
      if (!behavior.customerVisible) return false;
      return f.value != null && f.value.trim() !== "";
    })
    .map((f) => ({
      label: getFieldLabel({ key: f.key, label: f.label }),
      value: f.value as string,
    }));
}

function formatRuleValue(_key: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
}

function readPolicyLines(
  rules: Record<string, string | boolean | number | null>
): BoatDetailPolicyLine[] {
  const lines: BoatDetailPolicyLine[] = [];

  for (const key of POLICY_RULE_KEYS) {
    const formatted = formatRuleValue(key, rules[key]);
    if (!formatted) continue;
    lines.push({
      label: PRICING_FIELD_LABELS[key] ?? key.replace(/_/g, " "),
      value: formatted,
    });
  }

  for (const group of INCLUDED_FEE_FIELD_GROUPS) {
    const { mode, fee } = readIncludedFeePair(
      rules as Record<string, string | boolean>,
      group.includedKey,
      group.notIncludedKey
    );
    if (!mode) continue;
    lines.push({
      label: group.label,
      value: mode === "included" ? "Fiyata dahil" : fee.trim() || "Dahil değil",
    });
  }

  return lines;
}

function readDepositLabel(rules: Record<string, unknown>): string | null {
  const raw = rules.deposit_type_payment_before;
  if (raw == null || raw === "") return null;
  const key = String(raw);
  return DEPOSIT_LABELS[key] ?? key;
}

function readCancellationLabel(rules: Record<string, unknown>): string | null {
  const raw = rules.cancellation_policy;
  if (raw == null || raw === "") return null;
  const key = String(raw);
  return CANCELLATION_LABELS[key] ?? key;
}

function readApprovalLabel(approvalType: SerializedBoatDTO["approvalType"]): string {
  return approvalType === ApprovalType.INSTANT
    ? "Anında rezervasyon"
    : "Onay gerekli";
}

function readRulesText(
  boat: SerializedBoatDTO,
  rules: Record<string, string | boolean | number | null>
): string | null {
  const fromPricing = rules.boat_rules_and_policies;
  if (fromPricing != null && String(fromPricing).trim()) {
    return String(fromPricing).trim();
  }
  if (boat.rulesText?.trim()) return boat.rulesText.trim();
  return null;
}

/** Maps the onboarding boat state into the public detail view model. */
export function toBoatDetailViewModel(boat: SerializedBoatDTO): BoatDetailViewModel {
  const gallery: BoatDetailGalleryImage[] = [...boat.photos]
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder)
    .filter((p) => !!p.publicUrl)
    .map((p) => ({ url: p.publicUrl as string, alt: p.altText ?? boat.title ?? "Tekne" }));

  const rules = (boat.structuredRules ?? {}) as Record<
    string,
    string | boolean | number | null
  >;
  const features = featureMap(boat);
  const contactForFuelCost = rules.contactForFuelCost === true;
  const fuelCostNote =
    !contactForFuelCost && rules.fuel_cost != null && String(rules.fuel_cost).trim() !== ""
      ? String(rules.fuel_cost)
      : null;

  const specs = readSpecs(boat);
  const stats = readStats(features);
  const highlights = [...stats.map((s) => ({ label: s.label, value: s.value })), ...specs];

  const amenities: BoatDetailAmenity[] = boat.amenities
    .filter((a) => a.isIncluded || a.isExtra)
    .map((a) => ({
      label: a.label,
      isExtra: a.isExtra,
      extraPrice: a.extraPrice,
      currency: a.currency,
    }));

  const pricing: BoatDetailPrice[] = boat.pricing
    .filter((p) => p.price > 0)
    .map((p) => ({
      label: getListingModelPriceLabel(p.listingModelKey, p.listingModelLabel),
      price: p.price,
      currency: p.currency,
    }));

  const boatPlanUrl = boat.features.find((f) => f.key === "boat_plan")?.value ?? null;

  const documentBadges = boat.documents.map((d) => `${d.documentTypeLabel} mevcut`);

  return {
    title: boat.title ?? "İsimsiz tekne",
    subtitle: readSubtitle(features),
    boatTypeLabel: boat.boatType?.label ?? null,
    gallery,
    stats,
    specs,
    highlights,
    description: boat.description?.trim() ? boat.description : null,
    amenities,
    pricing,
    rules: readRulesText(boat, rules),
    policyLines: readPolicyLines(rules),
    depositLabel: readDepositLabel(rules),
    cancellationLabel: readCancellationLabel(rules),
    approvalLabel: readApprovalLabel(boat.approvalType),
    documentBadges,
    location: readLocation(boat),
    boatPlanUrl,
    contactForFuelCost,
    fuelCostNote,
  };
}
