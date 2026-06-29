import type {
  ApprovalType,
  BoatDocumentDTO,
  BoatExtraDTO,
  BoatListItemDTO,
  BoatPhotoDTO,
  BoatStatus,
  DocumentStatus,
  ExtraPricingType,
  OnboardingStep,
  ProgressState,
  SerializedBoatDTO,
} from "@getyourboat/shared";

export interface BoatOwnership {
  id: string;
  ownerId: string;
  status: BoatStatus;
}

export interface FeatureWrite {
  key: string;
  value?: string | null;
}

export interface AmenityWrite {
  amenityKey: string;
  isIncluded: boolean;
  isExtra: boolean;
  extraPrice: number | null;
  currency: string | null;
}

export interface PricingWrite {
  listingModelKey: string;
  price: number;
  currency: string;
}

export interface ExtraWrite {
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  pricingType: ExtraPricingType;
}

export interface PhotoWrite {
  storagePath: string;
  publicUrl: string | null;
  altText?: string | null;
  isCover: boolean;
  sortOrder: number;
}

export interface StoredFile {
  id: string;
  storagePath: string;
}

/**
 * Persistence port for boats and their onboarding sub-resources. The API talks
 * only to this interface, never to Prisma directly. Implementations return
 * shared DTOs so business logic stays free of ORM types.
 */
export interface BoatRepository {
  createDraft(ownerId: string): Promise<SerializedBoatDTO>;
  getState(boatId: string): Promise<SerializedBoatDTO | null>;
  getOwnership(boatId: string): Promise<BoatOwnership | null>;
  getListingModelKeys(boatId: string): Promise<string[]>;
  listByOwner(ownerId: string): Promise<BoatListItemDTO[]>;
  listPending(): Promise<SerializedBoatDTO[]>;

  // Progress
  getCompletedSteps(boatId: string): Promise<OnboardingStep[]>;
  updateProgress(boatId: string, progress: ProgressState): Promise<void>;
  touchDraft(boatId: string, activeStep: OnboardingStep): Promise<void>;

  updateEngineType(
    boatId: string,
    engineType: import("@getyourboat/shared").EngineType | null
  ): Promise<void>;

  // Steps
  replaceListingModels(
    boatId: string,
    listingModelKeys: string[],
    approvalType: ApprovalType
  ): Promise<void>;
  setBoatTypeAndFeatures(
    boatId: string,
    boatTypeKey: string,
    features: FeatureWrite[],
    meta?: {
      engineType?: import("@getyourboat/shared").EngineType | null;
      cabinConfigurations?: import("@getyourboat/shared").CabinConfigurationInput[];
    }
  ): Promise<void>;
  upsertFeatureValues(boatId: string, features: FeatureWrite[]): Promise<void>;
  replaceAmenities(boatId: string, amenities: AmenityWrite[]): Promise<void>;
  setDescriptionRules(
    boatId: string,
    input: {
      title: string;
      description?: string | null;
      rulesText?: string | null;
      checkInNotes?: string | null;
      checkOutNotes?: string | null;
      structuredRules?: Record<string, string | boolean | number | null>;
    }
  ): Promise<void>;
  mergeStructuredRules(
    boatId: string,
    patch: Record<string, string | boolean | number | null>
  ): Promise<void>;
  setBoatPlanUrl(boatId: string, url: string | null): Promise<void>;
  replacePricing(boatId: string, pricing: PricingWrite[]): Promise<void>;

  // Extras
  addExtra(boatId: string, input: ExtraWrite): Promise<BoatExtraDTO>;
  updateExtra(
    boatId: string,
    extraId: string,
    input: ExtraWrite
  ): Promise<BoatExtraDTO | null>;
  deleteExtra(boatId: string, extraId: string): Promise<boolean>;

  // Photos
  countPhotos(boatId: string): Promise<number>;
  clearCoverFlags(boatId: string): Promise<void>;
  addPhoto(boatId: string, data: PhotoWrite): Promise<BoatPhotoDTO>;
  reorderPhotos(
    boatId: string,
    order: { id: string; sortOrder: number }[]
  ): Promise<BoatPhotoDTO[]>;
  setCover(boatId: string, photoId: string): Promise<BoatPhotoDTO[] | null>;
  findPhoto(boatId: string, photoId: string): Promise<StoredFile | null>;
  deletePhoto(photoId: string): Promise<void>;

  // Documents
  documentTypeExists(documentTypeKey: string): Promise<boolean>;
  addDocument(
    boatId: string,
    documentTypeKey: string,
    storagePath: string,
    publicUrl: string | null
  ): Promise<BoatDocumentDTO>;
  findDocument(boatId: string, documentId: string): Promise<StoredFile | null>;
  documentExists(documentId: string): Promise<boolean>;
  deleteDocument(documentId: string): Promise<void>;
  reviewDocument(
    documentId: string,
    reviewerId: string,
    status: DocumentStatus,
    reason?: string | null
  ): Promise<BoatDocumentDTO | null>;

  // Review workflow
  markSubmitted(boatId: string): Promise<void>;
  approve(boatId: string, reviewerId: string): Promise<void>;
  reject(boatId: string, reviewerId: string, reason: string): Promise<void>;

  updateApprovalType(boatId: string, approvalType: ApprovalType): Promise<void>;
  listStoragePaths(boatId: string): Promise<{ photos: string[]; documents: string[]; boatPlan: string | null }>;
  deleteBoat(boatId: string): Promise<void>;
}
