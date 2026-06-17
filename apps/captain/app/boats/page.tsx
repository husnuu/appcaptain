"use client";

import { Anchor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Skeleton } from "@getyourboat/ui";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { useMyBoats } from "../../lib/hooks";
import { STATUS_LABELS, STEP_LABELS } from "../../lib/onboarding";
import type { BoatStatus } from "../../lib/types";

const STATUS_VARIANT: Record<BoatStatus, "neutral" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

function BoatsContent() {
  const router = useRouter();
  const { data: boats, loading, error } = useMyBoats();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function newBoat() {
    setCreating(true);
    setCreateError(null);
    try {
      const boat = await api.createBoat();
      router.push(`/boats/${boat.id}`);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Tekne oluşturulamadı");
      setCreating(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-heading text-ink">Manage Boats</h1>
          <p className="mt-1 text-body-sm text-gray-500">
            İlanlarını oluştur, düzenle ve incelemeye gönder.
          </p>
        </div>
        <Button onClick={newBoat} loading={creating}>
          + Yeni Tekne
        </Button>
      </div>

      {error || createError ? (
        <div className="mb-4">
          <Alert variant="danger">{error ?? createError}</Alert>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
        </div>
      ) : !boats || boats.length === 0 ? (
        <EmptyState
          icon={Anchor}
          title="Henüz bir teknen yok"
          description="Başlamak için yeni bir tekne ekle ve onboarding sihirbazını tamamla."
          action={
            <Button onClick={newBoat} loading={creating}>
              + Yeni Tekne
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boats.map((boat) => {
            const cover = boat.photos?.[0]?.publicUrl;
            return (
              <Card
                key={boat.id}
                interactive
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/boats/${boat.id}/edit`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/boats/${boat.id}/edit`);
                }}
                className="overflow-hidden"
              >
                <div className="h-36 w-full bg-gray-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={boat.title ?? "Tekne"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      Fotoğraf yok
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink">{boat.title || "İsimsiz taslak"}</h3>
                    <Badge variant={STATUS_VARIANT[boat.status]}>
                      {STATUS_LABELS[boat.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-caption text-gray-500">
                    {boat.boatType?.label ?? "Tekne tipi seçilmedi"} ·{" "}
                    {STEP_LABELS[boat.currentStep]}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function BoatsPage() {
  return (
    <AppShell active="boats">
      <BoatsContent />
    </AppShell>
  );
}
