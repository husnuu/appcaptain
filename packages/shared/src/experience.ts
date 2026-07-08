import {
  ExperienceCategory,
  ExperienceStep,
  ExperiencePricingType,
  CancellationPolicyType,
  ExperienceStatus,
} from "./enums";

/** Canonical experience wizard step order. */
export const EXPERIENCE_STEP_ORDER: ExperienceStep[] = [
  ExperienceStep.CATEGORY,
  ExperienceStep.TITLE_DESCRIPTION,
  ExperienceStep.INCLUDED_INFO,
  ExperienceStep.LOGISTICS,
  ExperienceStep.PRICING,
  ExperienceStep.CANCELLATION,
  ExperienceStep.MEDIA,
];

export const EXPERIENCE_STEP_LABELS: Record<ExperienceStep, string> = {
  [ExperienceStep.CATEGORY]: "Kategori",
  [ExperienceStep.TITLE_DESCRIPTION]: "Başlık & Açıklama",
  [ExperienceStep.INCLUDED_INFO]: "Dahil / Hariç",
  [ExperienceStep.LOGISTICS]: "Lojistik",
  [ExperienceStep.PRICING]: "Fiyatlandırma",
  [ExperienceStep.CANCELLATION]: "İptal Politikası",
  [ExperienceStep.MEDIA]: "Medya",
};

export const EXPERIENCE_CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  [ExperienceCategory.BOAT_TOUR]: "Tekne Turu",
  [ExperienceCategory.WATER_SPORTS]: "Su Sporları",
  [ExperienceCategory.FISHING]: "Balıkçılık",
  [ExperienceCategory.DIVING_SNORKELING]: "Dalış / Şnorkel",
  [ExperienceCategory.SUNSET_CRUISE]: "Gün Batımı Turu",
  [ExperienceCategory.PRIVATE_CHARTER_EXPERIENCE]: "Özel Charter Deneyimi",
  [ExperienceCategory.WORKSHOP_CLASS]: "Atölye / Ders",
  [ExperienceCategory.OTHER]: "Diğer",
};

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceStatus, string> = {
  [ExperienceStatus.DRAFT]: "Taslak",
  [ExperienceStatus.PENDING_REVIEW]: "İncelemede",
  [ExperienceStatus.CHANGES_REQUESTED]: "Değişiklik İstendi",
  [ExperienceStatus.APPROVED]: "Onaylandı",
  [ExperienceStatus.ACTIVE]: "Yayında",
  [ExperienceStatus.PAUSED]: "Duraklatıldı",
  [ExperienceStatus.REJECTED]: "Reddedildi",
};

export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicyType, string> = {
  [CancellationPolicyType.FREE_24H]: "24 saat önce ücretsiz iptal",
  [CancellationPolicyType.FREE_48H]: "48 saat önce ücretsiz iptal",
  [CancellationPolicyType.NON_REFUNDABLE]: "İade yok",
  [CancellationPolicyType.CUSTOM]: "Özel politika",
};

export const EXPERIENCE_PRICING_TYPE_LABELS: Record<ExperiencePricingType, string> = {
  [ExperiencePricingType.PER_PERSON]: "Kişi başı",
  [ExperiencePricingType.PER_GROUP]: "Grup başı",
};

export function experienceStepIndex(step: ExperienceStep): number {
  return EXPERIENCE_STEP_ORDER.indexOf(step);
}

/** Tamamlanan adımlardan yüzde (0-100) hesaplar. */
export function experienceCompletionPercent(
  completedSteps: ExperienceStep[]
): number {
  const total = EXPERIENCE_STEP_ORDER.length;
  if (total === 0) return 0;
  const done = new Set(completedSteps);
  const count = EXPERIENCE_STEP_ORDER.filter((s) => done.has(s)).length;
  return Math.round((count / total) * 100);
}

export interface ExperienceProgressState {
  completedSteps: ExperienceStep[];
  currentStep: ExperienceStep;
  isReadyForSubmit: boolean;
}

export function computeExperienceProgress(
  completedSteps: ExperienceStep[],
  justCompleted?: ExperienceStep
): ExperienceProgressState {
  const set = new Set<ExperienceStep>(completedSteps);
  if (justCompleted) set.add(justCompleted);
  const completed = EXPERIENCE_STEP_ORDER.filter((s) => set.has(s));
  const currentStep =
    EXPERIENCE_STEP_ORDER.find((s) => !set.has(s)) ?? ExperienceStep.MEDIA;
  const isReadyForSubmit = EXPERIENCE_STEP_ORDER.every((s) => set.has(s));
  return { completedSteps: completed, currentStep, isReadyForSubmit };
}
