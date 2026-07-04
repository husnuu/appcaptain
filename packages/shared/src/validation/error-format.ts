import type { ZodError, ZodIssue } from "zod";
import type { ValidationFieldError } from "../dto/validation";
import { FEATURE_FIELD_LABELS } from "../onboarding/feature-labels";
import {
  INCLUDED_FEE_FIELD_GROUPS,
  LISTING_MODEL_PRICE_LABELS,
  PRICING_FIELD_LABELS,
} from "../onboarding/pricing-fields";

const INCLUDED_FEE_VALIDATION_LABELS = Object.fromEntries(
  INCLUDED_FEE_FIELD_GROUPS.map((g) => [g.includedKey, g.label])
);

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  boatTypeKey: "Tekne tipi",
  engineType: "Motor tipi",
  listingModelKeys: "Kiralama modeli",
  approvalType: "Onay tipi",
  title: "İlan başlığı",
  listing_title: "İlan başlığı",
  description: "Açıklama",
  country: "Ülke",
  region: "Bölge",
  city: "Şehir",
  marina: "Marina",
  manufacturer_brand: "Marka",
  model: "Model",
  // Experience (deneyim) fields
  category: "Kategori",
  referenceCode: "Referans kodu",
  shortDescription: "Kısa açıklama",
  fullDescription: "Tam açıklama",
  highlights: "Öne çıkanlar",
  keywords: "Anahtar kelimeler",
  included: "Fiyata dahil olanlar",
  notIncluded: "Fiyata dahil olmayanlar",
  notAllowed: "İzin verilmeyenler",
  toBring: "Getirmeniz gerekenler",
  knowBeforeYouGo: "Gitmeden bilinmesi gerekenler",
  emergencyContactPhone: "Acil durum telefonu",
  durationMinutes: "Süre",
  meetingPoint: "Buluşma noktası",
  meetingTime: "Buluşma saati",
  endPoint: "Bitiş noktası",
  languages: "Diller",
  minParticipants: "Minimum katılımcı",
  maxParticipants: "Maksimum katılımcı",
  minAge: "Minimum yaş",
  ticketType: "Bilet tipi",
  requiredEquipment: "Gerekli ekipman",
  accessibilityInfo: "Erişilebilirlik bilgisi",
  accessibilityOptions: "Erişilebilirlik seçenekleri",
  basePrice: "Fiyat",
  currency: "Para birimi",
  pricingType: "Fiyatlandırma tipi",
  childDiscountPercent: "Çocuk indirimi",
  cancellationPolicy: "İptal politikası",
  cancellationPolicyText: "İptal politikası açıklaması",
  coverPhotoUrl: "Kapak fotoğrafı",
  videoUrl: "Video bağlantısı",
  ...FEATURE_FIELD_LABELS,
  ...PRICING_FIELD_LABELS,
  ...INCLUDED_FEE_VALIDATION_LABELS,
};

const MESSAGE_KEY_PATTERNS = [
  /Required feature missing: (.+)/i,
  /Required field missing: (.+)/i,
  /Required location field missing: (.+)/i,
  /Required amenity missing: (.+)/i,
  /Extra price required for (.+)/i,
];

/** Human-readable Turkish label for a validation field key. */
export function getValidationFieldLabel(field: string): string {
  if (LISTING_MODEL_PRICE_LABELS[field]) return LISTING_MODEL_PRICE_LABELS[field];
  if (field.startsWith("pricing.")) {
    const idx = field.slice("pricing.".length);
    return `Kiralama fiyatı (${idx})`;
  }
  return VALIDATION_FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

function parseKeyFromMessage(message: string): string | null {
  for (const pattern of MESSAGE_KEY_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function resolveFieldKey(path: (string | number)[]): string {
  if (path.length === 0) return "_form";

  const first = path[0];
  const last = path[path.length - 1];

  if (first === "pricing" && path.length >= 2) {
    return String(path[1]);
  }

  if (
    typeof last === "string" &&
    (first === "fieldValues" || first === "bookingFields" || first === "features")
  ) {
    return last;
  }

  if (typeof last === "string") return last;
  return String(last);
}

function issueMessageToTurkish(issue: ZodIssue, label: string): string {
  if (issue.code === "custom") {
    if (issue.message.startsWith("Extra price required for")) {
      return `${label} için ekstra ücret girilmelidir.`;
    }
    if (MESSAGE_KEY_PATTERNS.some((p) => p.test(issue.message))) {
      return `${label} zorunludur.`;
    }
    if (issue.message.includes("no crew")) {
      return "Mürettebat sayısı girilmeli veya “Mürettebat yok” işaretlenmeli.";
    }
    if (issue.message.includes("extraPrice")) {
      return `${label} için ekstra ücret girilmelidir.`;
    }
  }

  if (issue.code === "too_small") {
    if (issue.type === "string") return `${label} en az ${issue.minimum} karakter olmalıdır.`;
    if (issue.type === "array") return `${label} için en az bir seçim yapılmalıdır.`;
    if (issue.type === "number") return `${label} ${issue.minimum} veya daha büyük olmalıdır.`;
  }

  if (issue.code === "invalid_enum_value") {
    return `${label} geçerli bir değer olmalıdır.`;
  }

  if (issue.message.toLowerCase().includes("required")) {
    return `${label} zorunludur.`;
  }

  return issue.message;
}

function issueToField(issue: ZodIssue): ValidationFieldError {
  let field = resolveFieldKey(issue.path);
  if (field === "features" || field === "amenities" || field === "_form") {
    const fromMessage = parseKeyFromMessage(issue.message);
    if (fromMessage) field = fromMessage;
  }
  if (field === "title") field = "listing_title";

  const label = getValidationFieldLabel(field);
  return { field, message: issueMessageToTurkish(issue, label) };
}

/** Converts a Zod error into the standard `{ field, message }[]` API format. */
export function zodErrorToValidationFields(error: ZodError): ValidationFieldError[] {
  const seen = new Set<string>();
  const fields: ValidationFieldError[] = [];

  for (const issue of error.issues) {
    const entry = issueToField(issue);
    if (seen.has(entry.field)) continue;
    seen.add(entry.field);
    fields.push(entry);
  }

  return fields;
}

/** Builds the full validation error payload for HTTP responses. */
export function buildValidationErrorResponse(error: ZodError): {
  error: "VALIDATION_ERROR";
  message: string;
  fields: ValidationFieldError[];
} {
  const fields = zodErrorToValidationFields(error);
  return {
    error: "VALIDATION_ERROR",
    message: "Validation failed",
    fields,
  };
}
