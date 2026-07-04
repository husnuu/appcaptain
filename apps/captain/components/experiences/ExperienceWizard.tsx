"use client";

import {
  Badge,
  Button,
  cn,
  FontAwesomeIcon,
  ProgressBar,
  faArrowLeft,
  faCheck,
  faLock,
  faPaperPlane,
} from "@getyourboat/ui";
import { ExperienceStatus, ExperienceStep } from "@getyourboat/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import {
  EXPERIENCE_STATUS_LABELS,
  EXPERIENCE_STATUS_VARIANT,
  EXPERIENCE_STEP_LABELS,
  EXPERIENCE_STEP_ORDER,
  experienceStepIndex,
} from "../../lib/experience";
import type { ExperienceDTO } from "@getyourboat/shared";
import { Alert, Spinner } from "../ui";
import { EXPERIENCE_STEP_COMPONENTS } from "./steps";

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

  const progressPercent = useMemo(() => {
    if (!experience) return 0;
    return Math.round(
      (experience.progress.completedSteps.length / EXPERIENCE_STEP_ORDER.length) * 100
    );
  }, [experience]);

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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !experience) {
    return <Alert variant="danger">{error ?? "Deneyim bulunamadı"}</Alert>;
  }

  const StepComponent = EXPERIENCE_STEP_COMPONENTS[active];
  const canSubmit =
    experience.progress.isReadyForSubmit &&
    experience.status !== ExperienceStatus.PENDING_REVIEW &&
    experience.status !== ExperienceStatus.ACTIVE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {experience.title || "Yeni Deneyim"}
          </h1>
          <Badge variant={EXPERIENCE_STATUS_VARIANT[experience.status]} className="mt-2">
            {EXPERIENCE_STATUS_LABELS[experience.status]}
          </Badge>
          {experience.reviewNote ? (
            <p className="mt-2 text-sm text-amber-700">{experience.reviewNote}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/experiences")}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[14px]" aria-hidden />
            Listeye dön
          </button>
          {canSubmit ? (
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              {submitting ? "Gönderiliyor…" : "İncelemeye gönder"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="mb-6 lg:mb-0">
          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Tamamlanma</span>
                <span className="font-semibold text-brand-600">%{progressPercent}</span>
              </div>
              <ProgressBar percent={progressPercent} />
            </div>
            <nav className="space-y-1">
              {navItems.map((item, idx) => {
                const isActive = item.id === active;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.reachable}
                    onClick={() => item.reachable && setActive(item.id as ExperienceStep)}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-brand-50 font-medium text-ink"
                        : item.reachable
                          ? "text-gray-600 hover:bg-gray-100/70"
                          : "cursor-not-allowed text-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        isActive
                          ? "bg-brand-500 text-white"
                          : item.done
                            ? "border border-brand-200 bg-brand-50 text-brand-600"
                            : item.reachable
                              ? "border border-gray-200 bg-white text-gray-400"
                              : "border border-gray-100 bg-gray-50 text-gray-300"
                      )}
                    >
                      {item.done && !isActive ? (
                        <FontAwesomeIcon icon={faCheck} className="text-[11px]" aria-hidden />
                      ) : !item.reachable ? (
                        <FontAwesomeIcon icon={faLock} className="text-[10px]" aria-hidden />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-6">
          <StepComponent
            experience={experience}
            onSaved={setExperience}
            onNext={() => {
              const idx = experienceStepIndex(active);
              const next = EXPERIENCE_STEP_ORDER[idx + 1];
              if (next) setActive(next);
            }}
          />
          {submitError ? (
            <div className="mt-4">
              <Alert variant="danger">{submitError}</Alert>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
