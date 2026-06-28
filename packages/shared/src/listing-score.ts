import { STEP_ORDER } from "./constants";
import type { SerializedBoatDTO } from "./dto/onboarding";
import { OnboardingStep } from "./enums";
import type { FeatureSubTabId } from "./onboarding/feature-subtabs";

export type StepInfoCardKey =
  | "engine"
  | "cabins"
  | "specs"
  | "amenities"
  | "location"
  | "description"
  | "images"
  | "documents"
  | "listing_model"
  | "pricing"
  | "preview";

/** İpucu metinleri — aktif wizard adımına göre. */
export const STEP_INFO_CARDS: Record<
  StepInfoCardKey,
  { title: string; description: string }
> = {
  listing_model: {
    title: "Kiralama modeli",
    description:
      "Saatlik veya konaklamalı kiralama seçerek ilanın hangi paketlerde listeleneceğini belirle.",
  },
  specs: {
    title: "Tekne özellikleri",
    description:
      "Marka, model ve temel teknik bilgileri doldur — müşteriler tekneni daha kolay bulur.",
  },
  engine: {
    title: "Motor bilgileri",
    description:
      "Motor tipi ve performans verileri, doğru müşteri eşleşmesi için önemlidir.",
  },
  cabins: {
    title: "Kabin düzeni",
    description:
      "Kabin tiplerini ve WC detaylarını ekleyerek kapasiteyi net şekilde göster.",
  },
  amenities: {
    title: "Donanımlar",
    description:
      "Fiyata dahil olanakları ve ekstra hizmetleri ayır — şeffaflık güven oluşturur.",
  },
  location: {
    title: "Konum",
    description: "Marina ve bölge bilgisi, müşterilerin tekneye ulaşmasını kolaylaştırır.",
  },
  description: {
    title: "Açıklama",
    description:
      "Net ve çekici bir başlık + açıklama, arama sonuçlarında öne çıkmanı sağlar.",
  },
  images: {
    title: "Fotoğraflar",
    description: "Kaliteli fotoğraflar rezervasyon oranını belirgin şekilde artırır.",
  },
  pricing: {
    title: "Fiyatlandırma",
    description: "Doğru fiyat, teknene uygun talep almanı sağlar.",
  },
  documents: {
    title: "Belgeler",
    description: "Ruhsat ve sigorta belgeleri ilanın onaylanması için gereklidir.",
  },
  preview: {
    title: "Önizleme",
    description: "Göndermeden önce ilanının müşteri gözüyle nasıl göründüğünü kontrol et.",
  },
};

export function calculateWizardListingScore(completedSteps: OnboardingStep[]): number {
  const done = new Set(completedSteps);
  const finished = STEP_ORDER.filter((s) => done.has(s)).length;
  return Math.round((finished / STEP_ORDER.length) * 100);
}

export function resolveStepInfoCardKey(
  wizardStep: OnboardingStep | "PREVIEW",
  featureSubTab?: FeatureSubTabId
): StepInfoCardKey {
  if (wizardStep === "PREVIEW") return "preview";
  if (wizardStep === OnboardingStep.BOAT_TYPE_FEATURES) {
    return featureSubTab ?? "specs";
  }
  switch (wizardStep) {
    case OnboardingStep.LISTING_MODEL:
      return "listing_model";
    case OnboardingStep.AMENITIES:
      return "amenities";
    case OnboardingStep.LOCATION:
      return "location";
    case OnboardingStep.DESCRIPTION_RULES:
      return "description";
    case OnboardingStep.PHOTOS:
      return "images";
    case OnboardingStep.PRICING:
      return "pricing";
    case OnboardingStep.DOCUMENTS:
      return "documents";
    default:
      return "specs";
  }
}

/** Üst stepper ile aynı adım listesi — tamamlanma durumu. */
export function buildWizardStepProgress(
  completedSteps: OnboardingStep[],
  activeStep: OnboardingStep | "PREVIEW"
) {
  const done = new Set(completedSteps);
  return STEP_ORDER.map((step) => ({
    step,
    done: done.has(step),
    current: activeStep === step,
  }));
}

/** Canlı tamamlanma — kayıtlı adımlar + dolu alanlar. */
export function deriveCompletedWizardSteps(boat: SerializedBoatDTO): OnboardingStep[] {
  const steps = new Set<OnboardingStep>(boat.progress.completedSteps);

  if (boat.listingModels.length > 0) steps.add(OnboardingStep.LISTING_MODEL);
  if (
    boat.boatType &&
    boat.features.some((f) => f.key === "manufacturer_brand" && f.value?.trim())
  ) {
    steps.add(OnboardingStep.BOAT_TYPE_FEATURES);
  }
  if (boat.amenities.some((a) => a.isIncluded || a.isExtra)) {
    steps.add(OnboardingStep.AMENITIES);
  }
  if (
    boat.features.some(
      (f) =>
        (["country", "region", "city", "marina"].includes(f.key) && f.value?.trim()) ||
        (f.key === "latitude" && f.value?.trim()) ||
        (f.key === "longitude" && f.value?.trim())
    )
  ) {
    steps.add(OnboardingStep.LOCATION);
  }
  if (boat.title?.trim() && boat.description?.trim()) {
    steps.add(OnboardingStep.DESCRIPTION_RULES);
  }
  if (boat.photos.length > 0) steps.add(OnboardingStep.PHOTOS);
  if (boat.pricing.length > 0) steps.add(OnboardingStep.PRICING);
  if (boat.documents.length > 0) steps.add(OnboardingStep.DOCUMENTS);

  return STEP_ORDER.filter((s) => steps.has(s));
}
