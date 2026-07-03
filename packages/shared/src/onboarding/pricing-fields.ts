import type { FieldValueMap } from "./field-values";

/** Stored in `*_included` when the fee is covered in the listing price. */
export const INCLUDED_FEE_YES = "yes";

export interface IncludedFeeFieldGroup {
  includedKey: string;
  notIncludedKey: string;
  label: string;
  feePlaceholder: string;
  /** Kaptana ücretin ne olduğunu açıklayan kısa not. */
  description?: string;
}

export const INCLUDED_FEE_FIELD_GROUPS: IncludedFeeFieldGroup[] = [
  {
    includedKey: "mooring_fees_included",
    notIncludedKey: "mooring_fees_not_included",
    label: "Liman Ücreti",
    feePlaceholder: "Örn. 500 ₺/gece",
    description: "Teknenin bağlandığı marinaya ödenen liman/geceleme ücretidir.",
  },
  {
    includedKey: "final_cleaning_included",
    notIncludedKey: "final_cleaning_not_included",
    label: "Final Temizlik Ücreti",
    feePlaceholder: "Örn. 1.500 ₺",
    description: "Kiralama sonunda teknenin temizliği için alınan tek seferlik ücrettir.",
  },
  {
    includedKey: "transit_log_included",
    notIncludedKey: "transit_log_not_included",
    label: "Geçiş Belgesi (Transit Log)",
    feePlaceholder: "Örn. 2.000 ₺",
    description: "Transit log, yabancı sularda seyir için gerekli resmi belgedir.",
  },
];

/** Second half of each included/not-included pair — rendered inside the composite control. */
export const INCLUDED_FEE_SKIP_KEYS = new Set(
  INCLUDED_FEE_FIELD_GROUPS.map((g) => g.notIncludedKey)
);

const includedFeeByIncludedKey = new Map(
  INCLUDED_FEE_FIELD_GROUPS.map((g) => [g.includedKey, g])
);

export function getIncludedFeeGroup(includedKey: string): IncludedFeeFieldGroup | undefined {
  return includedFeeByIncludedKey.get(includedKey);
}

export type IncludedFeeMode = "included" | "not_included" | "";

export function readIncludedFeePair(
  values: FieldValueMap,
  includedKey: string,
  notIncludedKey: string
): { mode: IncludedFeeMode; fee: string } {
  const notVal = String(values[notIncludedKey] ?? "").trim();
  const incVal = String(values[includedKey] ?? "").trim();

  if (notVal) return { mode: "not_included", fee: notVal };

  if (
    incVal === INCLUDED_FEE_YES ||
    incVal.toLowerCase() === "yes" ||
    incVal.toLowerCase() === "included"
  ) {
    return { mode: "included", fee: "" };
  }

  if (incVal) return { mode: "included", fee: "" };

  return { mode: "", fee: "" };
}

export function writeIncludedFeePair(
  mode: "included" | "not_included",
  fee: string,
  includedKey: string,
  notIncludedKey: string
): Record<string, string> {
  if (mode === "included") {
    return { [includedKey]: INCLUDED_FEE_YES, [notIncludedKey]: "" };
  }
  return { [includedKey]: "", [notIncludedKey]: fee.trim() };
}

export const TIME_FIELD_KEYS = new Set([
  "check_in",
  "check_out",
  "check_in_time_day_rental",
  "check_out_time_day_rental",
]);

export function toTimeInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const short = trimmed.match(/^(\d{1,2})$/);
  if (short?.[1]) return `${short[1].padStart(2, "0")}:00`;
  const withMinutes = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (withMinutes?.[1] && withMinutes[2]) {
    return `${withMinutes[1].padStart(2, "0")}:${withMinutes[2]}`;
  }
  return trimmed;
}

/** "HH:MM" -> total minutes since midnight, or null when unparseable. */
export function timeToMinutes(value: string): number | null {
  const match = toTimeInputValue(value).match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export interface CheckTimeGroup {
  inKey: string;
  outKey: string;
  title: string;
  subtitle: string;
  inDefault: string;
  outDefault: string;
  /**
   * When true, check-out must be strictly after check-in (same-day rental).
   * Overnight/weekly stays check out the next morning, so no ordering applies.
   */
  enforceOrder: boolean;
}

/** Check-in/out time pairs rendered as grouped cards in the Fiyat step. */
export const CHECK_TIME_GROUPS: CheckTimeGroup[] = [
  {
    inKey: "check_in",
    outKey: "check_out",
    title: "Konaklamalı / Haftalık Kiralama Saatleri",
    subtitle: "Stay Included ve haftalık kiralamalar için geçerlidir.",
    inDefault: "14:00",
    outDefault: "10:00",
    enforceOrder: false,
  },
  {
    inKey: "check_in_time_day_rental",
    outKey: "check_out_time_day_rental",
    title: "Günlük Kiralama Saatleri",
    subtitle: "Günlük (daily) kiralamalar için geçerlidir.",
    inDefault: "09:00",
    outDefault: "18:00",
    enforceOrder: true,
  },
];

/** Sensible per-field default check-in/out time, used when the value is empty. */
export const CHECK_TIME_DEFAULTS: Record<string, string> = CHECK_TIME_GROUPS.reduce(
  (acc, g) => {
    acc[g.inKey] = g.inDefault;
    acc[g.outKey] = g.outDefault;
    return acc;
  },
  {} as Record<string, string>
);

/** Second (check-out) key of each pair — skipped in the field loop; rendered inside the group. */
export const CHECK_TIME_SKIP_KEYS = new Set(CHECK_TIME_GROUPS.map((g) => g.outKey));

const checkTimeGroupByKey = new Map<string, CheckTimeGroup>();
for (const group of CHECK_TIME_GROUPS) {
  checkTimeGroupByKey.set(group.inKey, group);
  checkTimeGroupByKey.set(group.outKey, group);
}

export function getCheckTimeGroup(key: string): CheckTimeGroup | undefined {
  return checkTimeGroupByKey.get(key);
}

/**
 * Returns titles of daily groups where check-out is not after check-in.
 * Only groups with `enforceOrder` are validated, and only when both values exist.
 */
export function getInvalidCheckTimeGroupTitles(
  values: Record<string, unknown>
): string[] {
  const invalid: string[] = [];
  for (const group of CHECK_TIME_GROUPS) {
    if (!group.enforceOrder) continue;
    const inMin = timeToMinutes(String(values[group.inKey] ?? ""));
    const outMin = timeToMinutes(String(values[group.outKey] ?? ""));
    if (inMin != null && outMin != null && outMin <= inMin) {
      invalid.push(group.title);
    }
  }
  return invalid;
}

export const WEEKDAY_OPTIONS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export type DurationUnit = "gece" | "gün";

export function parseMinRentalDuration(value: string): { amount: string; unit: DurationUnit } {
  const trimmed = value.trim();
  if (!trimmed) return { amount: "", unit: "gece" };

  const match = trimmed.match(/^(\d+)\s*(gece|gün|gun|night|day|days|nights)?/i);
  if (match?.[1]) {
    const rawUnit = match[2]?.toLowerCase() ?? "";
    const unit: DurationUnit =
      rawUnit.startsWith("g") || rawUnit.startsWith("d") ? "gün" : "gece";
    return { amount: match[1], unit };
  }

  const digits = trimmed.replace(/\D/g, "");
  return { amount: digits, unit: "gece" };
}

export function formatMinRentalDuration(amount: string, unit: DurationUnit): string {
  const n = amount.replace(/\D/g, "");
  if (!n) return "";
  return `${n} ${unit}`;
}

export function parseDailyAcUsage(value: string): { hours: string } {
  const trimmed = value.trim();
  if (!trimmed) return { hours: "" };
  const match = trimmed.match(/^(\d+)/);
  return { hours: match?.[1] ?? trimmed.replace(/\D/g, "") };
}

export function formatDailyAcUsage(hours: string): string {
  const n = hours.replace(/\D/g, "");
  if (!n) return "";
  return `${n} saat/gün`;
}

/** Captain-facing Turkish labels for Fiyat adımı booking/pricing fields. */
export const PRICING_FIELD_LABELS: Record<string, string> = {
  deposit_type_payment_before: "Depozito Tipi (ön ödeme yüzdesi)",
  instant_booking: "Anında Rezervasyon",
  confirmation_required: "Onay Gerekli",
  cancellation_policy: "İptal Politikası",
  check_in: "Giriş Saati",
  check_out: "Çıkış Saati",
  check_in_time_day_rental: "Giriş Saati (günlük kiralama)",
  check_out_time_day_rental: "Çıkış Saati (günlük kiralama)",
  fuel_cost: "Yakıt Ücreti",
  min_rental_duration: "Minimum Kiralama Süresi",
  weekly_check_in_out_day: "Haftalık Teslim/Teslim Alma Günü",
  daily_a_c_usage: "Günlük Klima Kullanımı",
  boat_rules_and_policies: "Tekne Kuralları ve Politikalar",
  alcohol_allowed: "Alkol İzni",
  outside_food_drink_allowed: "Dışarıdan Yiyecek/İçecek İzni",
  services_dj_photoshoot_decoration_birthday_laser_show_etc: "Ek Hizmetler (DJ, fotoğraf vb.)",
};

export const PRICING_FIELD_PLACEHOLDERS: Record<string, string> = {
  boat_rules_and_policies:
    "Örn. Tekne üzerinde sigara içilmez, evcil hayvan kabul edilmez.",
  services_dj_photoshoot_decoration_birthday_laser_show_etc:
    "Örn. DJ, doğum günü süslemesi talep üzerine sağlanır.",
};

export const LISTING_MODEL_PRICE_LABELS: Record<string, string> = {
  hourly: "Saatlik Kiralama Ücreti",
  daily: "Günlük Kiralama Ücreti",
  overnight: "Gece Konaklama Ücreti",
  weekly_charter: "Haftalık Kiralama Ücreti",
};

/** @deprecated Paket bazlı zorunluluk seed + getRequiredPricingFieldKeys ile yönetilir. */
export const OPTIONAL_PRICING_FIELD_KEYS = new Set<string>();

export const BOOLEAN_BOOKING_FIELD_KEYS = new Set([
  "alcohol_allowed",
  "outside_food_drink_allowed",
]);

export const PRICING_REQUIRED_HINT =
  "Yıldızlı alanları doldur. Kiralama fiyatları 0’dan büyük olmalı; dahil/değil seçeneklerinden birini işaretle.";

export function extractFileNameFromStoragePath(storagePath: string): string {
  const segment = storagePath.split("/").pop() ?? storagePath;
  const dashIndex = segment.indexOf("-");
  if (dashIndex >= 0) {
    const name = segment.slice(dashIndex + 1);
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  }
  return segment;
}

export function getListingModelPriceLabel(key: string, fallback: string): string {
  return LISTING_MODEL_PRICE_LABELS[key] ?? fallback;
}
