import type {
  ExperienceDTO,
  ExperienceListItemDTO,
  ExperienceProgressState,
  ExperienceCustomerInfoFieldDTO,
  ExperienceSeasonalPricingRuleDTO,
} from "@getyourboat/shared";
import type {
  CancellationPolicyType,
  ExperienceCategory,
  ExperiencePricingType,
  ExperienceStatus,
  ExperienceStep,
  ExperienceProductType,
  ExperienceDifficultyLevel,
  CustomerInfoFieldType,
} from "@getyourboat/shared";
import { computeExperienceProgress, experienceCompletionPercent } from "@getyourboat/shared";

export interface ExperienceWriteBase {
  category?: ExperienceCategory | null;
  secondaryCategories?: ExperienceCategory[];
  productType?: ExperienceProductType | null;
  title?: string;
  referenceCode?: string | null;
  shortDescription?: string;
  fullDescription?: string;
  highlights?: string[];
  keywords?: string[];
  included?: string[];
  notIncluded?: string[];
  notAllowed?: string[];
  toBring?: string[];
  knowBeforeYouGo?: string[];
  emergencyContactPhone?: string | null;
  difficultyLevel?: ExperienceDifficultyLevel | null;
  durationMinutes?: number;
  meetingPoint?: string;
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingTime?: string;
  endPoint?: string;
  endPointLat?: number | null;
  endPointLng?: number | null;
  isSameEndPoint?: boolean;
  languages?: string[];
  minParticipants?: number;
  maxParticipants?: number;
  minAge?: number | null;
  ticketType?: string | null;
  requiredEquipment?: string[];
  accessibilityInfo?: string | null;
  accessibilityOptions?: string[];
  pickupOffered?: boolean;
  pickupAreas?: string | null;
  pickupFee?: number | null;
  basePrice?: number;
  currency?: string;
  pricingType?: ExperiencePricingType;
  childDiscountPercent?: number | null;
  currencyLocked?: boolean;
  displayCurrency?: string | null;
  cancellationPolicy?: CancellationPolicyType;
  cancellationPolicyText?: string | null;
  cancellationTiers?: { daysBefore: number; refundPercent: number }[];
  coverPhotoUrl?: string;
  photoUrls?: string[];
  videoUrl?: string | null;
}

export interface CustomerInfoFieldInput {
  label: string;
  fieldType: CustomerInfoFieldType;
  required?: boolean;
  helpText?: string | null;
  options?: string[];
}

export interface SeasonalPricingRuleInput {
  label?: string;
  startDate: Date;
  endDate: Date;
  price: number;
}

export interface ExperienceRepository {
  createDraft(captainId: string): Promise<ExperienceDTO>;
  listByCaptain(captainId: string): Promise<ExperienceListItemDTO[]>;
  getById(id: string): Promise<ExperienceDTO | null>;
  getOwned(id: string, captainId: string): Promise<ExperienceDTO | null>;
  updateFields(id: string, data: ExperienceWriteBase): Promise<ExperienceDTO>;
  updateProgress(id: string, progress: ExperienceProgressState): Promise<void>;
  updateStatus(id: string, status: ExperienceStatus, reviewNote?: string | null): Promise<ExperienceDTO>;
  delete(id: string): Promise<void>;
  addCustomerInfoField(
    experienceId: string,
    input: CustomerInfoFieldInput
  ): Promise<ExperienceCustomerInfoFieldDTO[]>;
  removeCustomerInfoField(experienceId: string, fieldId: string): Promise<ExperienceCustomerInfoFieldDTO[]>;
  addSeasonalPricingRule(
    experienceId: string,
    input: SeasonalPricingRuleInput
  ): Promise<ExperienceSeasonalPricingRuleDTO[]>;
  removeSeasonalPricingRule(experienceId: string, ruleId: string): Promise<ExperienceSeasonalPricingRuleDTO[]>;
}

export function toExperienceDTO(row: ExperienceRow): ExperienceDTO {
  const completedSteps = row.completedSteps as ExperienceStep[];
  const progress = computeExperienceProgress(completedSteps);
  return {
    id: row.id,
    captainId: row.captainId,
    status: row.status as ExperienceStatus,
    progress,
    category: (row.category as ExperienceCategory | null) ?? null,
    secondaryCategories: (row.secondaryCategories ?? []) as ExperienceCategory[],
    productType: (row.productType as ExperienceProductType | null) ?? null,
    title: row.title,
    referenceCode: row.referenceCode,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    highlights: row.highlights,
    keywords: row.keywords,
    included: row.included,
    notIncluded: row.notIncluded,
    notAllowed: row.notAllowed,
    toBring: row.toBring,
    knowBeforeYouGo: row.knowBeforeYouGo,
    emergencyContactPhone: row.emergencyContactPhone,
    difficultyLevel: (row.difficultyLevel as ExperienceDifficultyLevel | null) ?? null,
    durationMinutes: row.durationMinutes,
    meetingPoint: row.meetingPoint,
    meetingPointLat: row.meetingPointLat,
    meetingPointLng: row.meetingPointLng,
    meetingTime: row.meetingTime,
    endPoint: row.endPoint,
    endPointLat: row.endPointLat,
    endPointLng: row.endPointLng,
    isSameEndPoint: row.isSameEndPoint,
    languages: row.languages,
    minParticipants: row.minParticipants,
    maxParticipants: row.maxParticipants,
    minAge: row.minAge,
    ticketType: row.ticketType,
    requiredEquipment: row.requiredEquipment,
    accessibilityInfo: row.accessibilityInfo,
    accessibilityOptions: row.accessibilityOptions,
    pickupOffered: row.pickupOffered ?? false,
    pickupAreas: row.pickupAreas ?? null,
    pickupFee: row.pickupFee != null ? Number(row.pickupFee) : null,
    basePrice: Number(row.basePrice),
    currency: row.currency,
    pricingType: row.pricingType as ExperiencePricingType,
    childDiscountPercent: row.childDiscountPercent,
    currencyLocked: row.currencyLocked ?? false,
    displayCurrency: row.displayCurrency ?? null,
    cancellationPolicy: row.cancellationPolicy as CancellationPolicyType,
    cancellationPolicyText: row.cancellationPolicyText,
    cancellationTiers: Array.isArray(row.cancellationTiers)
      ? (row.cancellationTiers as { daysBefore: number; refundPercent: number }[])
      : [],
    coverPhotoUrl: row.coverPhotoUrl,
    photoUrls: row.photoUrls,
    videoUrl: row.videoUrl,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customerInfoFields: (row.customerInfoFields ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      fieldType: f.fieldType as CustomerInfoFieldType,
      required: f.required,
      helpText: f.helpText,
      options: f.options,
      sortOrder: f.sortOrder,
    })),
    seasonalPricingRules: (row.seasonalPricingRules ?? []).map((r) => ({
      id: r.id,
      label: r.label,
      startDate: r.startDate,
      endDate: r.endDate,
      price: Number(r.price),
    })),
  };
}

export function toExperienceListItem(row: ExperienceRow): ExperienceListItemDTO {
  return {
    id: row.id,
    status: row.status as ExperienceStatus,
    category: (row.category as ExperienceCategory | null) ?? null,
    title: row.title || "İsimsiz taslak",
    shortDescription: row.shortDescription,
    coverPhotoUrl: row.coverPhotoUrl,
    durationMinutes: row.durationMinutes,
    maxParticipants: row.maxParticipants,
    basePrice: Number(row.basePrice),
    currency: row.currency,
    completionPercent: experienceCompletionPercent(
      row.completedSteps as ExperienceStep[]
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type ExperienceRow = {
  id: string;
  captainId: string;
  status: string;
  currentStep: string;
  completedSteps: string[];
  category: string | null;
  secondaryCategories?: string[];
  productType?: string | null;
  title: string;
  referenceCode: string | null;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  keywords: string[];
  included: string[];
  notIncluded: string[];
  notAllowed: string[];
  toBring: string[];
  knowBeforeYouGo: string[];
  emergencyContactPhone: string | null;
  difficultyLevel?: string | null;
  durationMinutes: number;
  meetingPoint: string;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  meetingTime: string;
  endPoint: string;
  endPointLat: number | null;
  endPointLng: number | null;
  isSameEndPoint: boolean;
  languages: string[];
  minParticipants: number;
  maxParticipants: number;
  minAge: number | null;
  ticketType: string | null;
  requiredEquipment: string[];
  accessibilityInfo: string | null;
  accessibilityOptions: string[];
  pickupOffered?: boolean;
  pickupAreas?: string | null;
  pickupFee?: { toNumber(): number } | number | string | null;
  basePrice: { toNumber(): number } | number | string;
  currency: string;
  pricingType: string;
  childDiscountPercent: number | null;
  currencyLocked?: boolean;
  displayCurrency?: string | null;
  cancellationPolicy: string;
  cancellationPolicyText: string | null;
  cancellationTiers?: unknown;
  coverPhotoUrl: string;
  photoUrls: string[];
  videoUrl: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerInfoFields?: {
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    helpText: string | null;
    options: string[];
    sortOrder: number;
  }[];
  seasonalPricingRules?: {
    id: string;
    label: string;
    startDate: Date;
    endDate: Date;
    price: { toNumber(): number } | number | string;
  }[];
};
