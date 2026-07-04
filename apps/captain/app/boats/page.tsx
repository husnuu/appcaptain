"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Button,
  FontAwesomeIcon,
  Skeleton,
  cn,
  faAnchor,
  faBolt,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@getyourboat/ui";
import { useAuth } from "../../components/auth-provider";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { useMyBoats, useProfile } from "../../lib/hooks";
import { STATUS_LABELS, STEP_LABELS, STEP_ORDER, stepIndex } from "../../lib/onboarding";
import type { ApprovalType, BoatListItem, BoatStatus } from "../../lib/types";

/** Pill status badge colors (doc-specified) — overlaid on the card cover. */
const STATUS_BADGE_STYLES: Record<BoatStatus, string> = {
  DRAFT: "bg-[#FEF3C7] text-[#92400E]",
  PENDING_REVIEW: "bg-[#DBEAFE] text-[#1D4ED8]",
  ACTIVE: "bg-[#D1FAE5] text-[#065F46]",
  REJECTED: "bg-[#FEE2E2] text-[#991B1B]",
  SUSPENDED: "bg-[#FEE2E2] text-[#991B1B]",
};

/** Rough completion hint for drafts, derived from the current wizard step. */
function draftPercent(currentStep: BoatListItem["currentStep"]): number {
  const done = stepIndex(currentStep);
  return Math.max(5, Math.round((done / STEP_ORDER.length) * 100));
}

function BoatsContent() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryEnabled = !authLoading && isAuthenticated;
  const { data: boats, loading, error, reload } = useMyBoats(queryEnabled);
  const { data: profile, loading: profileLoading } = useProfile(queryEnabled);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#111827]">Teknelerim</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Teknelerini ekle, düzenle, anlık rezervasyonu aç veya sil.
          </p>
        </div>
        <Button onClick={newBoat} loading={creating || profileLoading}>
          <FontAwesomeIcon icon={faPlus} className="text-[14px]" aria-hidden />
          Yeni Tekne
        </Button>
      </div>

      {!authLoading && !isAuthenticated ? (
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
      ) : null}

      {error || createError || actionError ? (
        <Alert variant="danger">
          <p>{error ?? createError ?? actionError}</p>
          {error?.includes("Oturumunuzun süresi doldu") ? (
            <Link href="/login" className="mt-2 inline-block font-medium underline">
              Giriş sayfasına git
            </Link>
          ) : null}
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : !list || list.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <FontAwesomeIcon icon={faAnchor} className="text-[64px] text-[#D1D5DB]" aria-hidden />
          <h3 className="mt-6 text-[20px] font-semibold text-[#374151]">Henüz teknen yok</h3>
          <p className="mt-2 text-[14px] text-[#9CA3AF]">
            Tekne ekleyerek kiralama almaya başla.
          </p>
          <div className="mt-6">
            <Button onClick={newBoat} loading={creating || profileLoading}>
              <FontAwesomeIcon icon={faPlus} className="text-[14px]" aria-hidden />
              İlk Tekneni Ekle
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((boat) => {
            const cover = boat.photos?.[0]?.publicUrl;
            const busy = busyId === boat.id;
            const instantOn = boat.approvalType === "INSTANT";
            const isDraft = boat.status === "DRAFT";
            const percent = draftPercent(boat.currentStep);

            return (
              <article
                key={boat.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
              >
                <div className="relative h-[180px] w-full">
                  {cover ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt={boat.title ?? "Tekne"}
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#F1F5F9]">
                      <FontAwesomeIcon
                        icon={faAnchor}
                        className="text-[32px] text-[#9CA3AF]"
                        aria-hidden
                      />
                      <span className="text-[13px] text-[#9CA3AF]">Fotoğraf eklenmedi</span>
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                      STATUS_BADGE_STYLES[boat.status]
                    )}
                  >
                    {STATUS_LABELS[boat.status]}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3
                      className={cn(
                        "truncate text-[16px] font-bold",
                        boat.title ? "text-[#111827]" : "italic text-[#9CA3AF]"
                      )}
                    >
                      {boat.title || "İsimsiz taslak"}
                    </h3>
                    <p className="mt-1 truncate text-[13px] text-[#6B7280]">
                      {boat.boatType?.label ?? "Tekne tipi seçilmedi"} ·{" "}
                      {STEP_LABELS[boat.currentStep]}
                    </p>
                  </div>

                  {isDraft ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div
                          className="h-full rounded-full bg-[#0097A7]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[12px] tabular-nums text-[#6B7280]">%{percent}</span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => router.push(`/boats/${boat.id}`)}
                      aria-label={`${boat.title || "Tekne"} düzenle`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#0097A7] bg-white px-3 text-[13px] font-medium text-[#0097A7] transition-colors hover:bg-[#F0FDFC] disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-[13px]" aria-hidden />
                      Düzenle
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggleInstantBooking(boat)}
                      className={cn(
                        "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors disabled:opacity-50",
                        instantOn
                          ? "bg-[#0097A7] text-white hover:bg-[#007A8A]"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <FontAwesomeIcon icon={faBolt} className="text-[13px]" aria-hidden />
                      {instantOn ? "Anlık booking açık" : "Anlık booking aç"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeBoat(boat)}
                      aria-label={`${boat.title || "Tekne"} sil`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FEE2E2] bg-[#FFF5F5] text-[#EF4444] transition-colors hover:bg-[#FEE2E2] disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[13px]" aria-hidden />
                    </button>
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
