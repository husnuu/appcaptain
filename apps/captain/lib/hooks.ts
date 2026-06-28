"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import type { BoatListItem, OnboardingConfig, SerializedBoat } from "./types";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "SESSION_EXPIRED") {
      return "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.";
    }
    if (err.status === 401) {
      return "Bu işlem için giriş yapmanız gerekiyor.";
    }
    return err.message;
  }
  return fallback;
}

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function useApiQuery<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  options?: { enabled?: boolean }
): QueryState<T> {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (err) {
      setError(errorMessage(err, "Yüklenemedi"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, reload: run };
}

/** Public onboarding config (boat types, listing models, amenities, ...). */
export function useOnboardingConfig() {
  return useApiQuery<OnboardingConfig>(() => api.getConfig(), []);
}

/** The signed-in captain's boats. */
export function useMyBoats(enabled = true) {
  return useApiQuery<BoatListItem[]>(
    () => api.myBoats().then((r) => r.items),
    [],
    { enabled }
  );
}

/** Owner profile for the pre-wizard gate. */
export function useProfile(enabled = true) {
  return useApiQuery(
    () => api.getProfile().then((r) => r.profile),
    [],
    { enabled }
  );
}

/**
 * Loads config + a single boat for the wizard and exposes a local boat setter
 * so steps can optimistically apply the server's returned state.
 * Config is re-resolved whenever listing models on the boat change.
 */
export function useBoatWizard(boatId: string) {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [boat, setBoatState] = useState<SerializedBoat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshConfig = useCallback(async (modelKeys: string[]) => {
    const cfg = await api.getConfig(modelKeys.length > 0 ? modelKeys : undefined);
    setConfig(cfg);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBoatState(null);
    setConfig(null);

    api
      .getBoat(boatId)
      .then(async (b) => {
        if (cancelled) return;
        if (b.id !== boatId) return;
        setBoatState(b);
        await refreshConfig(b.listingModels.map((m) => m.key));
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Yüklenemedi"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boatId, refreshConfig]);

  const setBoat = useCallback(
    async (b: SerializedBoat) => {
      setBoatState(b);
      await refreshConfig(b.listingModels.map((m) => m.key));
    },
    [refreshConfig]
  );

  const reload = useCallback(async () => {
    const b = await api.getBoat(boatId);
    setBoatState(b);
    await refreshConfig(b.listingModels.map((m) => m.key));
    return b;
  }, [boatId, refreshConfig]);

  return { config, boat, setBoat, error, loading, reload };
}
