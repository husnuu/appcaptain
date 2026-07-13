"use client";

import { useRouter } from "next/navigation";
import {
  Alert,
  EmptyState,
  FontAwesomeIcon,
  Skeleton,
  cn,
  faAnchor,
  faCalendarDays,
  faChevronRight,
} from "@getyourboat/ui";
import { useAuth } from "../../components/auth-provider";
import { AppShell } from "../../components/layout/AppShell";
import { useMyBoats } from "../../lib/hooks";
import { STATUS_LABELS } from "../../lib/onboarding";
import type { BoatStatus } from "../../lib/types";

const STATUS_BADGE_STYLES: Record<BoatStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  PENDING_REVIEW: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

function CalendarContent() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: boats, loading, error } = useMyBoats(!authLoading && isAuthenticated);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!boats || boats.length === 0) {
    return (
      <EmptyState
        title="Takvim için tekne yok"
        description="Önce bir tekne ekleyin; müsaitlik takvimi tekne bazında yönetilir."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boats.map((boat) => {
        const cover = boat.photos?.[0]?.publicUrl;
        return (
          <button
            key={boat.id}
            onClick={() => router.push(`/boats/${boat.id}/calendar`)}
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={boat.title ?? "Tekne"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FontAwesomeIcon icon={faAnchor} className="text-gray-400" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">
                {boat.title || "İsimsiz taslak"}
              </p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  STATUS_BADGE_STYLES[boat.status]
                )}
              >
                {STATUS_LABELS[boat.status]}
              </span>
            </div>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="text-xs text-gray-300 transition group-hover:text-brand-500"
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppShell active="calendar">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FontAwesomeIcon icon={faCalendarDays} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Takvim</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            Müsaitlik takvimini yönetmek için bir tekne seçin
          </p>
        </div>
      </div>
      <CalendarContent />
    </AppShell>
  );
}
