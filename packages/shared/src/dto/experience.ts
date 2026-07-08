import {
  ExperienceCategory,
  ExperiencePricingType,
  ExperienceStatus,
  ExperienceStep,
  CancellationPolicyType,
} from "../enums";

export interface ExperienceProgressDTO {
  currentStep: ExperienceStep;
  completedSteps: ExperienceStep[];
  isReadyForSubmit: boolean;
}

export interface ExperienceListItemDTO {
  id: string;
  status: ExperienceStatus;
  category: ExperienceCategory | null;
  title: string;
  shortDescription: string;
  coverPhotoUrl: string;
  durationMinutes: number;
  maxParticipants: number;
  basePrice: number;
  currency: string;
  /** Sihirbaz tamamlanma yüzdesi (0-100), taslak kartlarında gösterilir. */
  completionPercent: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ExperienceDTO {
  id: string;
  captainId: string;
  status: ExperienceStatus;
  progress: ExperienceProgressDTO;
  category: ExperienceCategory | null;
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
  basePrice: number;
  currency: string;
  pricingType: ExperiencePricingType;
  childDiscountPercent: number | null;
  cancellationPolicy: CancellationPolicyType;
  cancellationPolicyText: string | null;
  coverPhotoUrl: string;
  photoUrls: string[];
  videoUrl: string | null;
  reviewNote: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ExperienceAdminListItemDTO extends ExperienceListItemDTO {
  captainName: string | null;
  captainEmail: string | null;
}
