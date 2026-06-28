"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FontAwesomeIcon,
  Skeleton,
  faAnchor,
  faBolt,
  faPenToSquare,
  faTrash,
} from "@getyourboat/ui";
import { useAuth } from "../../components/auth-provider";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { useMyBoats, useProfile } from "../../lib/hooks";
import { STATUS_LABELS, STEP_LABELS } from "../../lib/onboarding";
import type { ApprovalType, BoatListItem, BoatStatus } from "../../lib/types";

const STATUS_VARIANT: Record<BoatStatus, "neutral" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

function BoatsContent() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: boats, loading, error, reload } = useMyBoats();
  const { data: profile, loading: profileLoading } = useProfile();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [items, setItems] = useState<BoatListItem[] | null>(null);

  const list = items ?? boats;

  async function newBoat() {
    if (profile && !profile.isComplete) {
      router.push("/profile/setup");
      return;
    }
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

  async function toggleInstantBooking(boat: BoatListItem) {
    setBusyId(boat.id);
    setActionError(null);
    const next: ApprovalType = boat.approvalType === "INSTANT" ? "MANUAL" : "INSTANT";
    try {
      await api.updateApprovalType(boat.id, next);
      setItems((prev) => {
        const base = prev ?? boats ?? [];
        return base.map((b) => (b.id === boat.id ? { ...b, approvalType: next } : b));
      });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  async function removeBoat(boat: BoatListItem) {
    const label = boat.title || "İsimsiz taslak";
    if (!window.confirm(`"${label}" teknesini silmek istediğine emin misin?`)) return;

    setBusyId(boat.id);
    setActionError(null);
    try {
      await api.deleteBoat(boat.id);
      setItems((prev) => {
        const base = prev ?? boats ?? [];
        return base.filter((b) => b.id !== boat.id);
      });
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Silinemedi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-card bg-ink-800 p-5 text-white shadow-card sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading text-white">Teknelerim</h1>
          <p className="mt-1 text-body-sm text-white/70">
            Teknelerini ekle, düzenle, anlık rezervasyonu aç veya sil.
          </p>
        </div>
        <Button onClick={newBoat} loading={creating || profileLoading}>
          + Yeni Tekne
        </Button>
      </div>

      {!authLoading && !isAuthenticated ? (
        <div className="mb-4">
          <Alert variant="info">
            Teknelerinizi görmek ve yönetmek için{" "}
            <Link href="/login" className="font-medium underline">
              giriş yapın
            </Link>
            . Henüz hesabınız yoksa{" "}
            <Link href="/signup" className="font-medium underline">
              kayıt olun
            </Link>
            .
          </Alert>
        </div>
      ) : null}

      {error || createError || actionError ? (
        <div className="mb-4">
          <Alert variant="danger">{error ?? createError ?? actionError}</Alert>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-card bg-white/10" />
          <Skeleton className="h-72 rounded-card bg-white/10" />
        </div>
      ) : !list || list.length === 0 ? (
        <EmptyState
          icon={faAnchor}
          title="Henüz bir teknen yok"
          description="Başlamak için yeni bir tekne ekle ve onboarding sihirbazını tamamla."
          action={
            <Button onClick={newBoat} loading={creating || profileLoading}>
              + Yeni Tekne
            </Button>
          }
          className="border-white/10 bg-white/5 [&_h3]:text-white [&_p]:text-white/70 [&_svg]:text-white/50"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((boat) => {
            const cover = boat.photos?.[0]?.publicUrl;
            const busy = busyId === boat.id;
            const instantOn = boat.approvalType === "INSTANT";

            return (
              <article
                key={boat.id}
                className="overflow-hidden rounded-card border border-white/10 bg-ink-900 shadow-card"
              >
                <div className="h-40 w-full bg-white/5">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={boat.title ?? "Tekne"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      Fotoğraf yok
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">
                        {boat.title || "İsimsiz taslak"}
                      </h3>
                      <p className="mt-1 text-caption text-white/60">
                        {boat.boatType?.label ?? "Tekne tipi seçilmedi"} ·{" "}
                        {STEP_LABELS[boat.currentStep]}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[boat.status]}>
                      {STATUS_LABELS[boat.status]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => router.push(`/boats/${boat.id}`)}
                      aria-label={`${boat.title || "Tekne"} düzenle`}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-[14px]" aria-hidden />
                      Düzenle
                    </Button>

                    <Button
                      size="sm"
                      variant={instantOn ? "primary" : "outline"}
                      className={
                        instantOn
                          ? undefined
                          : "border-white/20 bg-transparent text-white hover:bg-white/10"
                      }
                      disabled={busy}
                      loading={busy}
                      onClick={() => toggleInstantBooking(boat)}
                    >
                      <FontAwesomeIcon icon={faBolt} className="text-[14px]" aria-hidden />
                      {instantOn ? "Anlık booking açık" : "Anlık booking aç"}
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => removeBoat(boat)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[14px]" aria-hidden />
                      Sil
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BoatsPage() {
  return (
    <AppShell active="boats">
      <BoatsContent />
    </AppShell>
  );
}
