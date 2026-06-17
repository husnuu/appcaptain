"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import type { BoatListItem, OnboardingConfig, SerializedBoat } from "./types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function useApiQuery<T>(fn: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
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
  }, deps);

  useEffect(() => {
    let active = true;
    run().catch(() => {});
    return () => {
      active = false;
      void active;
    };
  }, [run]);

  return { data, loading, error, reload: run };
}

/** Public onboarding config (boat types, listing models, amenities, ...). */
export function useOnboardingConfig() {
  return useApiQuery<OnboardingConfig>(() => api.getConfig(), []);
}

/** The signed-in captain's boats. */
export function useMyBoats() {
  return useApiQuery<BoatListItem[]>(() => api.myBoats().then((r) => r.items), []);
}

/**
 * Loads config + a single boat for the wizard and exposes a local boat setter
 * so steps can optimistically apply the server's returned state.
 */
export function useBoatWizard(boatId: string) {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [boat, setBoat] = useState<SerializedBoat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getConfig(), api.getBoat(boatId)])
      .then(([cfg, b]) => {
        if (cancelled) return;
        setConfig(cfg);
        setBoat(b);
      })
      .catch((err) => setError(errorMessage(err, "Yüklenemedi")));
    return () => {
      cancelled = true;
    };
  }, [boatId]);

  const reload = useCallback(async () => {
    const b = await api.getBoat(boatId);
    setBoat(b);
    return b;
  }, [boatId]);

  return { config, boat, setBoat, error, reload };
}
