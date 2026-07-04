"use client";

import { useCallback, useState } from "react";
import {
  CREW_TAB_FIELD_KEYS,
  ENGINE_FIELD_KEYS,
  IDENTITY_FIELD_KEYS,
  NUMERIC_CABIN_FIELD_KEYS,
  getValidationFieldLabel,
  type FeatureSubTabId,
  type FieldErrorsMap,
} from "@getyourboat/shared";
import { ApiError } from "./api";
import type { SerializedBoat } from "./types";

export type { FieldErrorsMap };

export function featureFieldSubTab(field: string): FeatureSubTabId {
  if ((IDENTITY_FIELD_KEYS as readonly string[]).includes(field)) return "identity";
  if (field === "engineType") return "engine";
  if ((CREW_TAB_FIELD_KEYS as readonly string[]).includes(field)) return "cabins";
  if ((ENGINE_FIELD_KEYS as readonly string[]).includes(field)) return "engine";
  if (NUMERIC_CABIN_FIELD_KEYS.has(field)) return "cabins";
  return "specs";
}

export function firstSubTabWithErrors(errors: FieldErrorsMap): FeatureSubTabId | null {
  for (const key of Object.keys(errors)) {
    return featureFieldSubTab(key);
  }
  return null;
}

export function apiErrorToFieldErrors(err: unknown): {
  fieldErrors: FieldErrorsMap;
  summary: string | null;
} {
  if (err instanceof ApiError && err.fields?.length) {
    const fieldErrors: FieldErrorsMap = {};
    for (const entry of err.fields) {
      fieldErrors[entry.field] = entry.message;
    }
    const labels = err.fields.map((f) => getValidationFieldLabel(f.field));
    const summary =
      err.fields.length === 1
        ? `1 alan kontrol edilmeli: ${labels[0]}`
        : `${err.fields.length} alan kontrol edilmeli: ${labels.join(", ")}`;
    return { fieldErrors, summary };
  }

  if (err instanceof ApiError) {
    return { fieldErrors: {}, summary: err.message };
  }

  return { fieldErrors: {}, summary: "Kaydedilemedi" };
}

export function buildFieldLabelMap(fieldErrors: FieldErrorsMap): Record<string, string> {
  return Object.fromEntries(
    Object.keys(fieldErrors).map((key) => [key, getValidationFieldLabel(key)])
  );
}

/** Scroll to and focus the first invalid field marked with `data-field`. */
export function focusFirstFieldError(fieldErrors: FieldErrorsMap) {
  const firstKey = Object.keys(fieldErrors)[0];
  if (!firstKey || typeof document === "undefined") return;

  const root =
    document.querySelector(`[data-field="${firstKey}"]`) ??
    document.getElementById(`field-${firstKey}`);
  if (!root) return;

  root.scrollIntoView({ behavior: "smooth", block: "center" });

  const focusable =
    root instanceof HTMLInputElement ||
    root instanceof HTMLSelectElement ||
    root instanceof HTMLTextAreaElement
      ? root
      : root.querySelector<HTMLElement>("input, select, textarea, button[role='combobox']");

  focusable?.focus({ preventScroll: true });
}

export function useStepSaver(onSaved: (boat: SerializedBoat) => void) {
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorsMap>({});
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const run = useCallback(
    async (
      fn: () => Promise<SerializedBoat>,
      opts?: { onValidation?: (errors: FieldErrorsMap) => void }
    ) => {
      setBusy(true);
      setFieldErrors({});
      setErrorSummary(null);
      try {
        onSaved(await fn());
      } catch (err) {
        const { fieldErrors: nextErrors, summary } = apiErrorToFieldErrors(err);
        setFieldErrors(nextErrors);
        setErrorSummary(summary);
        opts?.onValidation?.(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
          requestAnimationFrame(() => focusFirstFieldError(nextErrors));
        }
      } finally {
        setBusy(false);
      }
    },
    [onSaved]
  );

  return {
    busy,
    fieldErrors,
    errorSummary,
    run,
    clearFieldError,
    setFieldErrors,
  };
}
