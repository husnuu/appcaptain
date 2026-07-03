/** Listing models the captain picks in step 1. */
export const LISTING_MODEL_KEYS = [
  "hourly",
  "daily",
  "overnight",
  "weekly_charter",
] as const;
export type ListingModelKey = (typeof LISTING_MODEL_KEYS)[number];

/** Requirement packages seeded from the PDF matrix. */
export const ONBOARDING_PACKAGE_KEYS = [
  "seahub_hourly",
  "seahub_stay_included",
] as const;
export type OnboardingPackageKey = (typeof ONBOARDING_PACKAGE_KEYS)[number];

/** Hourly/Daily → Mod A; Overnight/Weekly → Mod B. */
const HOURLY_MODELS = new Set<ListingModelKey>(["hourly", "daily"]);
const STAY_MODELS = new Set<ListingModelKey>(["overnight", "weekly_charter"]);

export const ONBOARDING_PACKAGE_LABELS: Record<OnboardingPackageKey, string> = {
  seahub_hourly: "Saatlik paket (Hourly / Daily)",
  seahub_stay_included: "Konaklamalı paket (Overnight / Weekly)",
};

/** Kaptana her kiralama modeli kartının altında gösterilen kısa açıklama. */
export const LISTING_MODEL_BRIEFS: Record<ListingModelKey, string> = {
  hourly:
    "Teknenizi saatlik olarak kiralayın. Günübirlik turlar, transfer ve kısa süreli kiralamalar için idealdir.",
  daily:
    "Teknenizi tam günlük olarak kiralayın. Sabah başlayıp akşam biten kiralamalar için.",
  overnight:
    "Geceleme dahil kiralama. Misafirler teknenizde konaklar; fiyata yatak ve hizmetler dahildir.",
  weekly_charter:
    "7 gece ve üzeri uzun süreli kiralamalar. Yelken tatilleri ve mavi yolculuklar için.",
};

/** Kiralama modeli seçimine göre kaptana gösterilecek kısa açıklama. */
export function describeListingModelPackages(listingModelKeys: string[]): string | null {
  const packages = resolvePackagesFromListingModels(listingModelKeys);
  if (packages.length === 0) return null;
  if (packages.length === 2) {
    return "Her iki paket birleştirilir: saatlik ve konaklamalı zorunlu alanların tamamı geçerli olur.";
  }
  if (packages[0] === "seahub_hourly") {
    return "Saatlik paket: daha az zorunlu alan (ör. kabin detayları ve check-in/out opsiyonel).";
  }
  return "Konaklamalı paket: kabin, banyo, check-in/out, ek donanımlar ve belgeler daha kapsamlı zorunlu.";
}

export function resolvePackagesFromListingModels(
  listingModelKeys: string[]
): OnboardingPackageKey[] {
  const packages = new Set<OnboardingPackageKey>();
  for (const key of listingModelKeys) {
    if (HOURLY_MODELS.has(key as ListingModelKey)) packages.add("seahub_hourly");
    if (STAY_MODELS.has(key as ListingModelKey)) packages.add("seahub_stay_included");
  }
  return ONBOARDING_PACKAGE_KEYS.filter((p) => packages.has(p));
}

export function isListingModelKey(key: string): key is ListingModelKey {
  return (LISTING_MODEL_KEYS as readonly string[]).includes(key);
}

export { HOURLY_MODELS, STAY_MODELS };
