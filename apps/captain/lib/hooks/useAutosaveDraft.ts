"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingStep } from "@getyourboat/shared";
import { api, ApiError } from "../api";
import type { SerializedBoat } from "../types";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;
const RETRY_MS = 3000;

export function useAutosaveDraft({
  boatId,
  step,
  getPayload,
  enabled = true,
  onSaved,
  onStatusChange,
}: {
  boatId: string;
  step: OnboardingStep;
  getPayload: () => Record<string, unknown>;
  enabled?: boolean;
  onSaved?: (boat: SerializedBoat) => void;
  onStatusChange?: (status: AutosaveStatus) => void;
}) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [hasPending, setHasPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getPayloadRef = useRef(getPayload);
  const savingRef = useRef(false);
  // Serialized snapshot of the last payload we actually sent. Used to skip a
  // PATCH when nothing really changed — otherwise deps that get a new object/
  // array reference on every re-render (e.g. boat.listingModels after setBoat)
  // retrigger the debounce forever, causing the "saved" badge to flash in a loop.
  const lastSavedPayloadRef = useRef<string | null>(null);

  getPayloadRef.current = getPayload;

  const setStatusSafe = useCallback(
    (next: AutosaveStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const save = useCallback(async () => {
    if (!enabled || savingRef.current) return;
    const payload = getPayloadRef.current();
    const serialized = JSON.stringify(payload);
    // Values are identical to the last successful save → skip the network call
    // so we don't loop on reference-only dependency changes.
    if (serialized === lastSavedPayloadRef.current) {
      clearTimer();
      setHasPending(false);
      return;
    }
    savingRef.current = true;
    clearTimer();
    setStatusSafe("saving");
    try {
      const updated = await api.patchBoatDraft(boatId, {
        step,
        data: payload,
      });
      lastSavedPayloadRef.current = serialized;
      onSaved?.(updated);
      setHasPending(false);
      setStatusSafe("saved");
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    } catch (err) {
      // A 4xx is a permanent validation/permission error — retrying the same
      // payload won't help, so surface it and stop the loop. Only auto-retry
      // transient failures (network drop / 5xx).
      const status = err instanceof ApiError ? err.status : undefined;
      const isClientError = status !== undefined && status >= 400 && status < 500;
      setHasPending(!isClientError);
      setStatusSafe("error");
      if (!isClientError && !retryRef.current) {
        retryRef.current = setTimeout(() => {
          retryRef.current = null;
          void save();
        }, RETRY_MS);
      }
    } finally {
      savingRef.current = false;
    }
  }, [boatId, step, clearTimer, enabled, onSaved, setStatusSafe]);

  const scheduleSave = useCallback(
    (immediate = false) => {
      if (!enabled) return;
      setHasPending(true);
      clearTimer();
      if (immediate) {
        void save();
        return;
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void save();
      }, DEBOUNCE_MS);
    },
    [clearTimer, enabled, save]
  );

  const flush = useCallback(async () => {
    clearTimer();
    await save();
  }, [clearTimer, save]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (retryRef.current) clearTimeout(retryRef.current);
      if (enabled) void save();
    };
    // Flush pending changes when the step unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boatId, step]);

  useEffect(() => {
    if (!hasPending || status !== "error") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasPending, status]);

  return { status, scheduleSave, flush, hasPending };
}

/** Watches `deps` and debounces draft saves; skips the initial mount. */
export function useStepDraftAutosave({
  boatId,
  step,
  getPayload,
  deps,
  enabled = true,
  onSaved,
  onStatusChange,
}: {
  boatId: string;
  step: OnboardingStep;
  getPayload: () => Record<string, unknown>;
  deps: unknown[];
  enabled?: boolean;
  onSaved?: (boat: SerializedBoat) => void;
  onStatusChange?: (status: AutosaveStatus) => void;
}) {
  // getPayload'ı çağıranın verdiği `deps` değiştiğinde yeniden oluştururuz;
  // bu bilinçli bir stabilizasyon deseni.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getPayloadStable = useCallback(getPayload, deps);
  const autosave = useAutosaveDraft({
    boatId,
    step,
    getPayload: getPayloadStable,
    enabled,
    onSaved,
    onStatusChange,
  });
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    autosave.scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return autosave;
}

export function formatLastSavedAt(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "az önce";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} dk önce`;
  return date.toLocaleString("tr-TR");
}
