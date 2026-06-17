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
  status: DocumentStatus;
  publicUrl: string | null;
  rejectionReason: string | null;
  uploadedAt: string | Date;
}

export interface BoatProgressDTO {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isReadyForReview: boolean;
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
  structuredRules: Record<string, boolean> | null;
  progress: BoatProgressDTO;
  listingModels: ListingModelOptionDTO[];
  features: BoatFeatureValueDTO[];
  amenities: BoatAmenityDTO[];
  photos: BoatPhotoDTO[];
  pricing: BoatPricingDTO[];
  extras: BoatExtraDTO[];
  documents: BoatDocumentDTO[];
  submittedAt: string | Date | null;
  reviewedAt: string | Date | null;
  rejectionReason: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BoatListItemDTO {
  id: string;
  title: string | null;
  status: BoatStatus;
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
