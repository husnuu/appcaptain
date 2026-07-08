import type {
  AmenityCategoryDTO,
  DocumentTypeDTO,
  FeatureGroupDTO,
  OnboardingFieldDTO,
} from "../dto/onboarding";
import { OnboardingStep } from "../enums";
import {
  classifyFeatureSubTab,
  isLocationFieldKey,
  type FeatureSubTabId,
} from "./feature-subtabs";
import {
  ALWAYS_OPTIONAL_FIELD_KEYS,
  isOwnerInputField,
  PET_POLICY_FIELD_KEYS,
} from "./field-metadata";
import { INCLUDED_FEE_SKIP_KEYS } from "./pricing-fields";
import { resolvePackagesFromListingModels, type OnboardingPackageKey } from "./constants";
import { fieldToWizardStep } from "./step-layout";

export function isFieldIncludedInPackage(
  field: Pick<OnboardingFieldDTO, "inclusions">,
  packageKey: OnboardingPackageKey
): boolean {
  return field.inclusions.some((i) => i.packageKey === packageKey && i.included);
}

/** Union of required field keys for the selected listing models. */
export function getRequiredFieldKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const packages = resolvePackagesFromListingModels(listingModelKeys);
  if (packages.length === 0) return [];

  const keys = new Set<string>();
  for (const field of fields) {
    if (!isOwnerInputField(field.key)) continue;
    if (packages.some((pkg) => isFieldIncludedInPackage(field, pkg))) {
      keys.add(field.key);
    }
  }
  return [...keys];
}

export function filterFieldsByListingModels(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): OnboardingFieldDTO[] {
  const required = new Set(getRequiredFieldKeys(fields, listingModelKeys));
  return fields.filter((f) => required.has(f.key));
}

export function filterFeatureGroups(
  groups: FeatureGroupDTO[],
  requiredKeys: ReadonlySet<string> | string[]
): FeatureGroupDTO[] {
  const keys = requiredKeys instanceof Set ? requiredKeys : new Set(requiredKeys);
  return groups
    .map((g) => ({
      ...g,
      features: g.features.filter((f) => keys.has(f.key) && !isLocationFieldKey(f.key)),
    }))
    .filter((g) => g.features.length > 0);
}

export function filterFeatureGroupsBySubTab(
  groups: FeatureGroupDTO[],
  tab: FeatureSubTabId
): FeatureGroupDTO[] {
  return groups
    .map((g) => ({
      ...g,
      features: g.features.filter(
        (f) => classifyFeatureSubTab(f.key, g.key) === tab && !isLocationFieldKey(f.key)
      ),
    }))
    .filter((g) => g.features.length > 0);
}

export function filterAmenityCategories(
  categories: AmenityCategoryDTO[],
  requiredKeys: ReadonlySet<string> | string[]
): AmenityCategoryDTO[] {
  const keys = requiredKeys instanceof Set ? requiredKeys : new Set(requiredKeys);
  return categories
    .map((c) => ({
      ...c,
      amenities: c.amenities.filter((a) => keys.has(a.key)),
    }))
    .filter((c) => c.amenities.length > 0);
}

export function filterDocumentTypes(
  documentTypes: DocumentTypeDTO[],
  requiredKeys: ReadonlySet<string> | string[]
): DocumentTypeDTO[] {
  const keys = requiredKeys instanceof Set ? requiredKeys : new Set(requiredKeys);
  return documentTypes.filter((d) => keys.has(d.key));
}

export function getRequiredLocationKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  const keys = getFieldsForWizardStep(scoped, OnboardingStep.LOCATION).map((f) => f.key);
  return [...keys, "latitude", "longitude"];
}

/** Listing copy (title, description) — evcil hayvan kuralları ayrı doğrulanır. */
export function getRequiredDescriptionFieldKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  return getFieldsForWizardStep(scoped, OnboardingStep.DESCRIPTION_RULES)
    .filter((f) => f.type === "media_description")
    .filter((f) => !ALWAYS_OPTIONAL_FIELD_KEYS.has(f.key))
    .map((f) => f.key);
}

/** Aktif paketlerde gösterilen evcil hayvan seçenekleri (en az biri işaretlenmeli). */
export function getPetPolicyFieldKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  const visible = new Set(
    getFieldsForWizardStep(scoped, OnboardingStep.DESCRIPTION_RULES).map((f) => f.key)
  );
  return PET_POLICY_FIELD_KEYS.filter((key) => visible.has(key));
}

export function getRequiredPricingFieldKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  return getFieldsForWizardStep(scoped, OnboardingStep.PRICING)
    .map((f) => f.key)
    .filter((key) => !INCLUDED_FEE_SKIP_KEYS.has(key));
}

export function getRequiredFeatureKeysForStep(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[],
  step: OnboardingStep = OnboardingStep.BOAT_TYPE_FEATURES
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  return getFieldsForWizardStep(scoped, step)
    .filter((f) => f.type === "feature" || f.type === "crew_option")
    .filter((f) => !ALWAYS_OPTIONAL_FIELD_KEYS.has(f.key))
    .map((f) => f.key);
}

/**
 * Donanımlarda "zorunlu" = "form'da GÖSTERİLMELİ" demek, "işaretli olmalı" değil.
 * Bir teknede jeneratör/radar/jakuzi gibi donanımlar OLMAYABİLİR; kaptanı sahip
 * olmadığı donanımı "var" demeye zorlamak yanlış. Bu yüzden hiçbir donanım
 * işaretlenmek zorunda değil — pakete göre gösterim filtrelemesi yeterli.
 * (Gösterim, listing-model'e göre amenity alanlarının config'e dahil edilmesiyle
 * sağlanır; bu fonksiyon yalnızca işaretleme zorunluluğunu kontrol eder.)
 */
export function getRequiredAmenityKeys(
  _fields: OnboardingFieldDTO[],
  _listingModelKeys: string[]
): string[] {
  return [];
}

export function getRequiredDocumentKeys(
  fields: OnboardingFieldDTO[],
  listingModelKeys: string[]
): string[] {
  const scoped = filterFieldsByListingModels(fields, listingModelKeys);
  return getFieldsForWizardStep(scoped, OnboardingStep.DOCUMENTS)
    .filter((f) => f.type === "document")
    .map((f) => f.key);
}

function getFieldsForWizardStep(fields: OnboardingFieldDTO[], step: OnboardingStep) {
  return fields.filter((f) => fieldToWizardStep(f) === step);
}

export { resolvePackagesFromListingModels };
