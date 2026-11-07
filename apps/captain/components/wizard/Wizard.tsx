"use client";

import { Button, FontAwesomeIcon, faPaperPlane } from "@getyourboat/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { AutosaveStatus } from "../../lib/hooks/useAutosaveDraft";
import { useBoatWizard } from "../../lib/hooks";
import {
  STATUS_LABELS,
  STEP_LABELS,
  STEP_ORDER,
  stepIndex,
} from "../../lib/onboarding";
import type { OnboardingStep, SerializedBoat } from "../../lib/types";
import { Alert, Spinner } from "../ui";
import { AutosaveStatusIndicator } from "./autosave-status";
import { FocusTopBar, TopBarButton, WizardChromeProvider, type FocusStep } from "./focus";
import {
  AmenitiesStep,
  BoatTypeFeaturesStep,
  DescriptionRulesStep,
  DocumentsStep,
  ListingModelStep,
  LocationStep,
  PreviewStep,
  PricingStep,
  PhotosStep,
  type StepProps,
} from "./steps";

const PREVIEW_ID = "PREVIEW";
type WizardStep = OnboardingStep | typeof PREVIEW_ID;

const STEP_COMPONENTS: Record<OnboardingStep, (p: StepProps) => JSX.Element> = {
  LISTING_MODEL: ListingModelStep,
  BOAT_TYPE_FEATURES: BoatTypeFeaturesStep,
  AMENITIES: AmenitiesStep,
  LOCATION: LocationStep,
  DESCRIPTION_RULES: DescriptionRulesStep,
  PHOTOS: PhotosStep,
  PRICING: PricingStep,
  DOCUMENTS: DocumentsStep,
};

export function Wizard({ boatId }: { boatId: string }) {
  const router = useRouter();
  const { config, boat, setBoat, error, loading, reload } = useBoatWizard(boatId);
  const [active, setActive] = useState<WizardStep>("LISTING_MODEL");
  const [synced, setSynced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");

  useEffect(() => {
    setSynced(false);
    setActive("LISTING_MODEL");
    setSubmitError(null);
  }, [boatId]);

  useEffect(() => {
    if (boat?.id === boatId && !synced) {
      setActive(boat.progress.activeStep ?? boat.progress.currentStep);
      setSynced(true);
    }
  }, [boat, boatId, synced]);

  function syncBoat(updated: SerializedBoat) {
    void setBoat(updated);
  }

  function handleSaved(updated: SerializedBoat) {
    void setBoat(updated);
    if (active === PREVIEW_ID) return;
    const idx = stepIndex(active);
    const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)] ?? active;
    setActive(next);
  }

  async function submit() {
    if (!boat) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await api.submit(boat.id);
      await setBoat(updated);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16">
        <Alert>{error}</Alert>
        <button
          type="button"
          onClick={() => router.push("/boats")}
          className="mt-6 text-[15px] font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          Teknelerime dön
        </button>
      </div>
    );
  }

  if (loading || !config || !boat || boat.id !== boatId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const isPreview = active === PREVIEW_ID;
  // Pending listings stay editable: the captain can revise while it waits for
  // review; saved changes keep the PENDING_REVIEW status (no re-submit needed).
  const canEditSteps =
    boat.status === "DRAFT" ||
    boat.status === "REJECTED" ||
    boat.status === "ACTIVE" ||
    boat.status === "PENDING_REVIEW";
  const canSubmit = boat.status === "DRAFT" || boat.status === "REJECTED";
  const idx = isPreview ? STEP_ORDER.length - 1 : stepIndex(active);
  const StepComponent = isPreview ? null : STEP_COMPONENTS[active as OnboardingStep];

  const completed = boat.progress.completedSteps;
  // First not-yet-completed step = the step the captain should be working on.
  const currentBoatStep = completed.length
    ? STEP_ORDER.find((s) => !completed.includes(s)) ?? "DOCUMENTS"
    : "LISTING_MODEL";
  const currentIdx = stepIndex(currentBoatStep);
  // Airbnb-style gating: a step is reachable only if it is already completed
  // (revisit) or it is the next step to complete. Jumping ahead to a locked
  // step is not allowed until the preceding steps are saved.
  const allStepsDone = STEP_ORDER.every((s) => completed.includes(s));
  const stepperItems: FocusStep[] = [
    ...STEP_ORDER.map((step, i) => ({
      id: step,
      label: STEP_LABELS[step],
      done: completed.includes(step),
      reachable: completed.includes(step) || i <= currentIdx,
      lockedHint: `Bu adıma geçmek için önce "${STEP_LABELS[currentBoatStep]}" adımını tamamlayın.`,
    })),
    {
      id: PREVIEW_ID,
      label: "Önizleme",
      done: false,
      reachable: allStepsDone,
      lockedHint: "Önizleme için önce tüm adımları tamamlayın.",
    },
  ];

  // Alt çubuktaki ilerleme: akıştaki konum (önizleme dahil).
  const progress = ((isPreview ? STEP_ORDER.length + 1 : idx + 1) / (STEP_ORDER.length + 1)) * 100;

  return (
    <WizardChromeProvider value={{ progress }}>
      <div className="min-h-screen bg-white">
        <FocusTopBar
          steps={stepperItems}
          currentId={active}
          onSelect={(id) => setActive(id as WizardStep)}
          actions={
            <>
              {canEditSteps ? (
                <AutosaveStatusIndicator
                  status={autosaveStatus}
                  lastSavedAt={boat.lastSavedAt}
                  className="mr-2 hidden md:flex"
                />
              ) : null}
              <TopBarButton onClick={() => router.push("/boats")} title="Değişiklikler otomatik kaydedilir">
                <span className="sm:hidden">Çık</span>
                <span className="hidden sm:inline">Kaydet ve çık</span>
              </TopBarButton>
            </>
          }
        />

        <main
          className={
            isPreview
              ? "mx-auto w-full max-w-[1100px] px-5 pb-36 pt-10 sm:px-8"
              : "mx-auto w-full max-w-[720px] px-5 pb-36 pt-10 sm:px-8 sm:pt-14"
          }
        >
          <div className="min-w-0">
            <h2 className="mb-6 truncate text-[13px] font-semibold text-accent-600">
              {boat.title || "İsimsiz taslak"}
              <span className="font-medium text-gray-400"> · Tekne ilanı</span>
            </h2>

            {boat.status === "REJECTED" && boat.rejectionReason ? (
              <div className="mb-8">
                <Alert>Reddedildi: {boat.rejectionReason}. Düzenleyip tekrar gönderebilirsin.</Alert>
              </div>
            ) : null}

            {boat.status === "PENDING_REVIEW" ? (
              <div className="mb-8">
                <Alert variant="info">
                  İlanın incelemede (ortalama 24-48 saat). Düzenlemeye devam edebilirsin;
                  değişikliklerin kaydedilir ve ilan onay beklemeye devam eder.
                </Alert>
              </div>
            ) : null}

            {boat.status === "ACTIVE" ? (
              <div className="mb-8">
                <Alert variant="success">İlanın onaylandı ve yayında! 🎉</Alert>
              </div>
            ) : null}

            {isPreview ? (
              <PreviewStep
                boat={boat}
                config={config}
                onSaved={handleSaved}
                reload={reload}
                goBack={() => setActive("DOCUMENTS")}
              />
            ) : canEditSteps && StepComponent ? (
              <StepComponent
                boat={boat}
                config={config}
                onSaved={handleSaved}
                reload={reload}
                goBack={() => setActive(STEP_ORDER[Math.max(idx - 1, 0)] ?? active)}
                syncBoat={syncBoat}
                onAutosaveStatusChange={setAutosaveStatus}
              />
            ) : (
              <p className="text-sm text-gray-500">
                Bu ilan şu an düzenlenemez ({STATUS_LABELS[boat.status]}).
              </p>
            )}

            {canSubmit && (isPreview || active === "DOCUMENTS") ? (
              <section className="mt-12 rounded-card border border-gray-200 bg-cream/60 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-md">
                    <p className="text-[16px] font-bold text-ink">İncelemeye gönder</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-gray-500">
                      Tüm zorunlu adımlar tamamlandığında (en az 1 fotoğraf, fiyat ve belge)
                      gönderebilirsin.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="sm:shrink-0"
                    disabled={!boat.progress.isReadyForReview || submitting}
                    onClick={submit}
                  >
                    {submitting ? (
                      "Gönderiliyor…"
                    ) : (
                      <>
                        Gönder
                        <FontAwesomeIcon icon={faPaperPlane} className="text-[14px]" aria-hidden />
                      </>
                    )}
                  </Button>
                </div>
                {submitError ? (
                  <div className="mt-3">
                    <Alert>{submitError}</Alert>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </WizardChromeProvider>
  );
}
