"use client";

import {
  Button,
  FontAwesomeIcon,
  faArrowLeft,
  faCalendarDays,
  faEye,
  faHouse,
  faPaperPlane,
} from "@getyourboat/ui";
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
import type { BoatStatus, OnboardingStep, SerializedBoat } from "../../lib/types";
import type { FeatureSubTabId } from "@getyourboat/shared";
import { Alert, Spinner } from "../ui";
import { ListingScorePanel } from "../boats/edit/ListingScorePanel";
import { AutosaveStatusIndicator } from "./autosave-status";
import { Stepper, type StepperItem } from "./Stepper";
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

// Tıklanamaz durum rozeti renkleri (duruma göre). Butona benzemesin diye
// pointer-events-none + küçük yuvarlak nokta ile durum göstergesi olarak sunulur.
const STATUS_BADGE_CLASS: Record<BoatStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  SUSPENDED: "bg-gray-100 text-gray-600 border-gray-200",
};

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
  const [featureSubTab, setFeatureSubTab] = useState<FeatureSubTabId>("specs");
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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Alert>{error}</Alert>
      </div>
    );
  }

  if (loading || !config || !boat || boat.id !== boatId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
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
  const stepperItems: StepperItem[] = [
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
      icon: faEye,
      done: false,
      reachable: allStepsDone,
      lockedHint: "Önizleme için önce tüm adımları tamamlayın.",
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <button
        onClick={() => router.push("/boats")}
        className="mb-5 flex items-center gap-1.5 text-body-sm font-medium text-brand-600 transition hover:text-brand-700"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-[14px]" aria-hidden />
        Teknelerim
      </button>

      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-gray-400">
            Tekne düzenle
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">
            {boat.title || "İsimsiz taslak"}
          </h1>
          {canEditSteps ? (
            <AutosaveStatusIndicator
              status={autosaveStatus}
              lastSavedAt={boat.lastSavedAt}
              className="mt-1"
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            className="border-2 border-brand-200 font-semibold text-brand-700 hover:bg-brand-50"
            onClick={() => router.push(`/boats/${boat.id}/calendar`)}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="text-[14px]" aria-hidden />
            Takvim
          </Button>
          <Button
            variant="outline"
            className="border-2 border-brand-500 font-semibold text-brand-600 hover:bg-brand-50"
            onClick={() => window.open(`/boats/${boat.id}/preview`, "_blank", "noopener,noreferrer")}
          >
            <FontAwesomeIcon icon={faEye} className="text-[14px]" aria-hidden />
            Önizle
          </Button>
          <span
            className={`pointer-events-none flex select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_BADGE_CLASS[boat.status]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
            {STATUS_LABELS[boat.status]}
          </span>
        </div>
      </div>

      {boat.status === "REJECTED" && boat.rejectionReason ? (
        <div className="mb-4">
          <Alert>Reddedildi: {boat.rejectionReason}. Düzenleyip tekrar gönderebilirsin.</Alert>
        </div>
      ) : null}

      {boat.status === "PENDING_REVIEW" ? (
        <div className="mb-4 space-y-3">
          <Alert variant="info">
            İlanın{boat.title ? ` "${boat.title}"` : ""} incelemeye gönderildi. Ortalama onay
            süresi 24-48 saattir. Onay durumunu &quot;Teknelerim&quot; sayfasından takip
            edebilirsin. İnceleme sürerken de düzenleme yapabilirsin; değişikliklerin kaydedilir
            ve ilan onay beklemeye devam eder.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-full bg-[#0F4C75] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d3d5e]"
            >
              <FontAwesomeIcon icon={faHouse} className="text-[14px]" aria-hidden />
              Ana Sayfaya Dön
            </button>
            <button
              type="button"
              onClick={() => router.push("/boats")}
              className="inline-flex items-center rounded-full border-2 border-[#0097A7] bg-white px-6 py-3 text-sm font-semibold text-[#0097A7] transition-colors hover:bg-[#E0F7FA]"
            >
              Teknelerim
            </button>
          </div>
        </div>
      ) : null}

      {boat.status === "ACTIVE" ? (
        <div className="mb-4">
          <Alert variant="success">İlanın onaylandı ve yayında! 🎉</Alert>
        </div>
      ) : null}

      <div className="mb-10">
        <Stepper items={stepperItems} currentId={active} onSelect={(id) => setActive(id as WizardStep)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
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
              onFeatureSubTabChange={
                active === "BOAT_TYPE_FEATURES" ? setFeatureSubTab : undefined
              }
            />
          ) : (
            <p className="text-sm text-slate-500">
              Bu ilan şu an düzenlenemez ({STATUS_LABELS[boat.status]}).
            </p>
          )}
        </div>

        <aside className="order-first lg:order-none">
          <ListingScorePanel
            boat={boat}
            activeStep={isPreview ? "PREVIEW" : (active as OnboardingStep)}
            featureSubTab={featureSubTab}
          />
        </aside>
      </div>

      {canSubmit ? (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="text-body-sm font-semibold text-ink">İncelemeye gönder</p>
              <p className="mt-0.5 text-caption text-gray-500">
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
        </div>
      ) : null}
    </div>
  );
}
