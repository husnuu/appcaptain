"use client";

import { faPaperPlane } from "@getyourboat/ui";
import { ExperienceStatus, ExperienceStep } from "@getyourboat/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import {
  EXPERIENCE_STEP_LABELS,
  EXPERIENCE_STEP_ORDER,
  experienceStepIndex,
} from "../../lib/experience";
import type { ExperienceDTO } from "@getyourboat/shared";
import { Alert, Spinner } from "../ui";
import { EXPERIENCE_STEP_COMPONENTS } from "./steps";
import { FocusTopBar, TopBarButton, WizardChromeProvider } from "../wizard/focus";

export function ExperienceWizard({ experienceId }: { experienceId: string }) {
  const router = useRouter();
  const [experience, setExperience] = useState<ExperienceDTO | null>(null);
  const [active, setActive] = useState<ExperienceStep>(ExperienceStep.CATEGORY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getExperience(experienceId);
        if (!alive) return;
        setExperience(data);
        setActive(data.progress.currentStep);
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : "Deneyim yüklenemedi");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [experienceId]);

  const navItems = useMemo(() => {
    if (!experience) return [];
    const completed = new Set(experience.progress.completedSteps);
    const activeIdx = experienceStepIndex(active);
    return EXPERIENCE_STEP_ORDER.map((step, idx) => ({
      id: step,
      label: EXPERIENCE_STEP_LABELS[step],
      done: completed.has(step),
      reachable: idx <= activeIdx || completed.has(step),
    }));
  }, [experience, active]);


  async function handleSubmit() {
    if (!experience) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const next = await api.submitExperience(experience.id);
      setExperience(next);
      router.push("/experiences");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-16">
        <Alert variant="danger">{error ?? "Deneyim bulunamadı"}</Alert>
        <button
          type="button"
          onClick={() => router.push("/experiences")}
          className="mt-6 text-[15px] font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          Deneyimlerime dön
        </button>
      </div>
    );
  }

  const StepComponent = EXPERIENCE_STEP_COMPONENTS[active];
  const canSubmit =
    experience.progress.isReadyForSubmit &&
    experience.status !== ExperienceStatus.PENDING_REVIEW &&
    experience.status !== ExperienceStatus.ACTIVE;

  const activeIdx = experienceStepIndex(active);
  const progress = ((activeIdx + 1) / EXPERIENCE_STEP_ORDER.length) * 100;
  const prevStep = EXPERIENCE_STEP_ORDER[activeIdx - 1];

  return (
    <WizardChromeProvider
      value={{ progress, onBack: prevStep ? () => setActive(prevStep) : undefined }}
    >
      <div className="min-h-screen bg-white">
        <FocusTopBar
          steps={navItems}
          currentId={active}
          onSelect={(id) => setActive(id as ExperienceStep)}
          actions={
            <TopBarButton onClick={() => router.push("/experiences")}>
              <span className="sm:hidden">Çık</span>
              <span className="hidden sm:inline">Listeye dön</span>
            </TopBarButton>
          }
        />

        <main className="mx-auto w-full max-w-[720px] px-5 pb-36 pt-10 sm:px-8 sm:pt-14">
          <h2 className="mb-6 truncate text-[13px] font-semibold text-accent-600">
            {experience.title || "Yeni Deneyim"}
            <span className="font-medium text-gray-400"> · Deneyim ilanı</span>
          </h2>
          {experience.reviewNote ? (
            <div className="mb-8">
              <Alert variant="warning">{experience.reviewNote}</Alert>
            </div>
          ) : null}
          {canSubmit ? (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-gray-200 bg-cream/60 px-5 py-4">
              <p className="text-[14.5px] font-semibold text-ink">Tüm adımlar tamamlandı.</p>
              <TopBarButton variant="primary" icon={faPaperPlane} onClick={() => void handleSubmit()}>
                {submitting ? "Gönderiliyor…" : "İncelemeye gönder"}
              </TopBarButton>
            </div>
          ) : null}

          <StepComponent
            experience={experience}
            onSaved={setExperience}
            onNext={() => {
              const next = EXPERIENCE_STEP_ORDER[activeIdx + 1];
              if (next) setActive(next);
            }}
          />
          {submitError ? (
            <div className="mt-6">
              <Alert variant="danger">{submitError}</Alert>
            </div>
          ) : null}
        </main>
      </div>
    </WizardChromeProvider>
  );
}
