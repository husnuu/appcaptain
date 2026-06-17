import type {
  AmenityCategoryDTO,
  BoatTypeOptionDTO,
  DocumentTypeDTO,
  FeatureGroupDTO,
  ListingModelOptionDTO,
  OnboardingConfigDTO,
  OnboardingFieldDTO,
} from "@getyourboat/shared";

export type LookupModel =
  | "listingModelOption"
  | "boatTypeOption"
  | "featureDefinition"
  | "amenity";

export interface FieldFilter {
  type?: string;
  section?: string;
  package?: string;
}

/** Read port for the seeded onboarding configuration / lookup tables. */
export interface OnboardingLookupRepository {
  getConfig(): Promise<OnboardingConfigDTO>;
  getBoatTypes(): Promise<BoatTypeOptionDTO[]>;
  getListingModels(): Promise<ListingModelOptionDTO[]>;
  getFeatureGroups(): Promise<FeatureGroupDTO[]>;
  getAmenityCategories(): Promise<AmenityCategoryDTO[]>;
  getDocumentTypes(): Promise<DocumentTypeDTO[]>;
  getFields(filter: FieldFilter): Promise<OnboardingFieldDTO[]>;
  countByKeys(model: LookupModel, keys: string[]): Promise<number>;
}
