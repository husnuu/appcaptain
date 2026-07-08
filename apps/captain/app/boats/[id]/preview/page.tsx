"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  BoatDetailView,
  BoatPreviewBanner,
} from "@getyourboat/ui";
import {
  calculateWizardListingScore,
  deriveCompletedWizardSteps,
  toBoatDetailViewModel,
} from "@getyourboat/shared";
import { useAuth } from "../../../../components/auth-provider";
import { Protected } from "../../../../components/protected";
import { Alert, Spinner } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import type { SerializedBoat } from "../../../../lib/types";

export default function BoatPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Önizleme yeni sekmede açılabildiğinden erişim token'ı henüz bellekte olmayabilir.
  // Oturum (refresh cookie'den) geri yüklenene kadar API isteğini bekletiyoruz;
  // aksi halde token'sız istek 401 verip "giriş yapmanız gerekiyor" hatası çıkarır.
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [boat, setBoat] = useState<SerializedBoat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api
      .getBoat(id)
      .then((data) => {
        if (!cancelled) setBoat(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Tekne yüklenemedi");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, authLoading, isAuthenticated]);

  const model = useMemo(() => (boat ? toBoatDetailViewModel(boat) : null), [boat]);
  const completionPercent = useMemo(() => {
    if (!boat) return undefined;
    return calculateWizardListingScore(deriveCompletedWizardSteps(boat));
  }, [boat]);

  return (
    <Protected>
      <div className="min-h-screen bg-white">
        <BoatPreviewBanner editHref={`/boats/${id}`} completionPercent={completionPercent} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : error ? (
            <Alert>{error}</Alert>
          ) : model ? (
            <BoatDetailView
              model={model}
              bookingDisabled
              showPlaceholders
              bookingLabel="Rezervasyon Yap"
            />
          ) : null}
        </main>
      </div>
    </Protected>
  );
}
