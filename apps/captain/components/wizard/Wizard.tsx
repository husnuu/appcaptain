"use client";

import { Button, Card, CardContent } from "@getyourboat/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useBoatWizard } from "../../lib/hooks";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  STEP_ORDER,
  stepIndex,
} from "../../lib/onboarding";
import type { OnboardingStep, SerializedBoat } from "../../lib/types";
import { Alert, Spinner } from "../ui";
import { Stepper } from "./Stepper";
import {
  AmenitiesStep,
  BoatTypeFeaturesStep,
  DescriptionRulesStep,
  DocumentsStep,
  ListingModelStep,
  PricingStep,
  PhotosStep,
  type StepProps,
} from "./steps";

const STEP_COMPONENTS: Record<OnboardingStep, (p: StepProps) => JSX.Element> = {
  LISTING_MODEL: ListingModelStep,
  BOAT_TYPE_FEATURES: BoatTypeFeaturesStep,
  AMENITIES: AmenitiesStep,
  DESCRIPTION_RULES: DescriptionRulesStep,
  PHOTOS: PhotosStep,
  PRICING: PricingStep,
  DOCUMENTS: DocumentsStep,
};

export function Wizard({ boatId }: { boatId: string }) {
  const router = useRouter();
  const { config, boat, setBoat, error, reload } = useBoatWizard(boatId);
  const [active, setActive] = useState<OnboardingStep>("LISTING_MODEL");
  const [synced, setSynced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (boat && !synced) {
      setActive(boat.progress.currentStep);
      setSynced(true);
    }
  }, [boat, synced]);

  function handleSaved(updated: SerializedBoat) {
    setBoat(updated);
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
      setBoat(updated);
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

  if (!config || !boat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[active];
  const editable = boat.status === "DRAFT" || boat.status === "REJECTED";
  const idx = stepIndex(active);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Teknelerim
      </button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {boat.title || "Yeni Tekne"}
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[boat.status]}`}
        >
          {STATUS_LABELS[boat.status]}
        </span>
      </div>

      {boat.status === "REJECTED" && boat.rejectionReason ? (
        <div className="mb-4">
          <Alert>Reddedildi: {boat.rejectionReason}. Düzenleyip tekrar gönderebilirsin.</Alert>
        </div>
      ) : null}

      {boat.status === "PENDING_REVIEW" ? (
        <div className="mb-4">
          <Alert variant="info">
            İlanın incelemeye gönderildi. Yönetici onayı bekleniyor.
          </Alert>
        </div>
      ) : null}

      {boat.status === "ACTIVE" ? (
        <div className="mb-4">
          <Alert variant="success">İlanın onaylandı ve yayında! 🎉</Alert>
        </div>
      ) : null}

      <div className="mb-6">
        <Stepper
          current={active}
          completed={boat.progress.completedSteps}
          onSelect={setActive}
        />
      </div>

      <Card>
        <CardContent className="py-6">
          {editable ? (
            <StepComponent
              boat={boat}
              config={config}
              onSaved={handleSaved}
              reload={reload}
              goBack={() => setActive(STEP_ORDER[Math.max(idx - 1, 0)] ?? active)}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Bu ilan şu an düzenlenemez ({STATUS_LABELS[boat.status]}).
            </p>
          )}
        </CardContent>
      </Card>

      {editable ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">İncelemeye gönder</p>
              <p className="text-xs text-slate-500">
                Tüm zorunlu adımlar tamamlandığında (en az 1 fotoğraf, fiyat ve belge)
                gönderebilirsin.
              </p>
            </div>
            <Button disabled={!boat.progress.isReadyForReview || submitting} onClick={submit}>
              {submitting ? "Gönderiliyor…" : "Gönder"}
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
