// The captain app consumes the canonical DTOs/enums from the shared package.
// These aliases keep local import sites stable while the types live in one place.
export type {
  ApprovalType,
  BoatStatus,
  OnboardingStep,
  DocumentStatus,
  BoatTypeOptionDTO as BoatTypeOption,
  ListingModelOptionDTO as ListingModelOption,
  FeatureDefinitionDTO as FeatureDefinition,
  FeatureGroupDTO as FeatureGroup,
  AmenityDTO as Amenity,
  AmenityCategoryDTO as AmenityCategory,
  DocumentTypeDTO as DocumentType,
  OnboardingConfigDTO as OnboardingConfig,
  BoatPhotoDTO as BoatPhoto,
  SerializedBoatDTO as SerializedBoat,
  BoatListItemDTO as BoatListItem,
  UploadUrlDTO as UploadUrlResponse,
} from "@getyourboat/shared";
