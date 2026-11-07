import type {
  ApprovalType,
  BoatStatus,
  DocumentStatus,
  ExtraPricingType,
  OnboardingStep,
} from "../enums";

/* ----------------------------- Lookup config ----------------------------- */

export interface BoatTypeOptionDTO {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export interface ListingModelOptionDTO {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export interface FeatureDefinitionDTO {
  id: string;
  key: string;
  label: string;
  groupKey: string;
  sortOrder: number;
}

export interface FeatureGroupDTO {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  features: FeatureDefinitionDTO[];
}

export interface AmenityDTO {
  id: string;
  key: string;
  label: string;
  categoryId: string;
  canBeExtra: boolean;
  sortOrder: number;
}

export interface AmenityCategoryDTO {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  amenities: AmenityDTO[];
}

export interface DocumentTypeDTO {
  id: string;
  key: string;
  label: string;
  required: boolean;
  sortOrder: number;
}

export interface OnboardingFieldInclusionDTO {
  id: string;
  fieldId: string;
  packageKey: string;
  included: boolean;
  note?: string | null;
}

export interface OnboardingFieldDTO {
  id: string;
  key: string;
  label: string;
  type: string;
  sectionKey: string;
  sourceSection?: string | null;
  sortOrder: number;
  sourceRow?: number | null;
  canBeExtra: boolean;
  amenityCategoryKey?: string | null;
  inclusions: OnboardingFieldInclusionDTO[];
}

export interface OnboardingConfigDTO {
  boatTypes: BoatTypeOptionDTO[];
  listingModels: ListingModelOptionDTO[];
  featureGroups: FeatureGroupDTO[];
  amenityCategories: AmenityCategoryDTO[];
  documentTypes: DocumentTypeDTO[];
}

/** Config filtered to required fields for the captain's selected listing models. */
export interface ResolvedOnboardingConfigDTO extends OnboardingConfigDTO {
  packages: string[];
  requiredFieldKeys: string[];
  fields: OnboardingFieldDTO[];
}

/* ------------------------------- Boat state ------------------------------- */

export interface BoatPhotoDTO {
  id: string;
  boatId: string;
  storagePath: string;
  publicUrl?: string | null;
  altText?: string | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string | Date;
}

export interface BoatFeatureValueDTO {
  key: string;
  label: string;
  group: string;
  value: string | null;
}

export interface BoatAmenityDTO {
  amenityId: string;
  key: string;
  label: string;
  category: string;
  isIncluded: boolean;
  isExtra: boolean;
  extraPrice: number | null;
  currency: string | null;
}

export interface BoatPricingDTO {
  listingModelKey: string;
  listingModelLabel: string;
  price: number;
  currency: string;
}

export interface BoatExtraDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  pricingType: ExtraPricingType;
}

export interface BoatDocumentDTO {
  id: string;
  documentTypeKey: string;
  documentTypeLabel: string;
  fileName: string;
  status: DocumentStatus;
  publicUrl: string | null;
  rejectionReason: string | null;
  uploadedAt: string | Date;
}

export interface BoatProgressDTO {
  currentStep: OnboardingStep;
  /** Furthest wizard step the captain has reached (autosave); never moves backward. */
  activeStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isReadyForReview: boolean;
}

/** İlan sahibinin herkese açık bilgileri — yalnızca ad (soyad paylaşılmaz). */
export interface PublicBoatOwnerDTO {
  name: string | null;
  avatarUrl: string | null;
  /** Kaptanın Ahoy'a katıldığı tarih (ISO). */
  joinedAt: string;
  badge: string | null;
}

export interface SerializedBoatDTO {
  id: string;
  ownerId: string;
  status: BoatStatus;
  approvalType: ApprovalType;
  boatType: BoatTypeOptionDTO | null;
  title: string | null;
  description: string | null;
  rulesText: string | null;
  checkInNotes: string | null;
  checkOutNotes: string | null;
  structuredRules: Record<string, boolean | string | number | null> | null;
  progress: BoatProgressDTO;
  listingModels: ListingModelOptionDTO[];
  features: BoatFeatureValueDTO[];
  amenities: BoatAmenityDTO[];
  photos: BoatPhotoDTO[];
  pricing: BoatPricingDTO[];
  extras: BoatExtraDTO[];
  documents: BoatDocumentDTO[];
  engineType: import("../enums").EngineType | null;
  cabinConfigurations: import("./cabin").CabinConfigurationDTO[];
  submittedAt: string | Date | null;
  reviewedAt: string | Date | null;
  rejectionReason: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastSavedAt: string | Date | null;
  /** Yalnızca herkese açık ilan uç noktası doldurur. */
  owner?: PublicBoatOwnerDTO | null;
}

export interface BoatListItemDTO {
  id: string;
  title: string | null;
  status: BoatStatus;
  approvalType: ApprovalType;
  currentStep: OnboardingStep;
  photos: BoatPhotoDTO[];
  boatType: BoatTypeOptionDTO | null;
  updatedAt: string | Date;
}

export interface UploadUrlDTO {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
}

/** Standard API response envelope shared across apps. */
export interface ApiErrorDTO {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ListResponse<T> {
  items: T[];
}

/** Autosave draft patch — partial step data, no required-field validation. */
export interface BoatDraftPatchDTO {
  step: import("../enums").OnboardingStep;
  data: Record<string, unknown>;
}
