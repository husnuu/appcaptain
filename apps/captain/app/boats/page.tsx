"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FontAwesomeIcon,
  Skeleton,
  cn,
  faAnchor,
  faArrowRight,
  faBolt,
  faCalendarDays,
  faEllipsis,
  faEye,
  faPlus,
  faTrash,
} from "@getyourboat/ui";
import { useAuth } from "../../components/auth-provider";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { useMyBoats } from "../../lib/hooks";
import { STATUS_LABELS, STEP_LABELS, STEP_ORDER, stepIndex } from "../../lib/onboarding";
import type { ApprovalType, BoatListItem, BoatStatus } from "../../lib/types";

/** Kapak üzerindeki durum rozeti (nokta + etiket). */
const STATUS_DOT: Record<BoatStatus, string> = {
  DRAFT: "bg-amber-500",
  PENDING_REVIEW: "bg-accent-500",
  ACTIVE: "bg-green-500",
  REJECTED: "bg-red-500",
  SUSPENDED: "bg-gray-400",
};

const BOAT_TYPE_TR: Record<string, string> = {
  sailboat: "Yelkenli",
  sailing_yacht: "Yelkenli",
  motoryacht: "Motoryat",
  motor_yacht: "Motoryat",
  motorboat: "Motorbot",
  catamaran: "Katamaran",
  gulet: "Gulet",
  speedboat: "Sürat teknesi",
  speed_boat: "Sürat teknesi",
  rib: "Şişme bot",
  luxury_yacht: "Lüks yat",
  fishing_boat: "Balıkçı teknesi",
  trawler: "Trawler",
};

/** Taslaklar için kabaca tamamlanma oranı (sihirbazdaki adıma göre). */
function draftPercent(currentStep: BoatListItem["currentStep"]): number {
  const done = stepIndex(currentStep);
  return Math.max(5, Math.round((done / STEP_ORDER.length) * 100));
}

function updatedLabel(value: string | Date): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (Number.isNaN(diff)) return "";
  if (diff < hour) return "Az önce güncellendi";
  if (diff < day) return "Bugün güncellendi";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days} gün önce güncellendi`;
  return `${date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })} güncellendi`;
}

function CardMenu({
  boat,
  busy,
  onRemove,
}: {
  boat: BoatListItem;
  busy: boolean;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-gray-50";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label={`${boat.title || "Tekne"} seçenekleri`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-ink disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faEllipsis} className="text-[16px]" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-10 z-20 w-52 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-modal"
        >
          <a
            role="menuitem"
            href={`/boats/${boat.id}/preview`}
            target="_blank"
            rel="noreferrer"
            className={cn(item, "text-ink")}
            onClick={() => setOpen(false)}
          >
            <FontAwesomeIcon icon={faEye} className="w-4 text-gray-400" aria-hidden />
            Önizle
          </a>
          <Link role="menuitem" href={`/boats/${boat.id}/calendar`} className={cn(item, "text-ink")}>
            <FontAwesomeIcon icon={faCalendarDays} className="w-4 text-gray-400" aria-hidden />
            Takvim
          </Link>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className={cn(item, "text-danger-600 hover:bg-danger-50")}
          >
            <FontAwesomeIcon icon={faTrash} className="w-4" aria-hidden />
            Sil
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InstantSwitch({ on, busy, onToggle }: { on: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
        <FontAwesomeIcon icon={faBolt} className={cn("text-[13px]", on ? "text-amber-500" : "text-gray-400")} aria-hidden />
        Anında rezervasyon
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Anında rezervasyon"
        disabled={busy}
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          on ? "bg-brand-500" : "bg-gray-300"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            on && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function BoatCard({
  boat,
  busy,
  onToggleInstant,
  onRemove,
}: {
  boat: BoatListItem;
  busy: boolean;
  onToggleInstant: () => void;
  onRemove: () => void;
}) {
  const cover = boat.photos?.find((p) => p.isCover)?.publicUrl ?? boat.photos?.[0]?.publicUrl;
  const isDraft = boat.status === "DRAFT";
  const percent = draftPercent(boat.currentStep);
  const type = boat.boatType ? BOAT_TYPE_TR[boat.boatType.key] ?? boat.boatType.label : "Tekne tipi seçilmedi";
  const href = `/boats/${boat.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-gray-200/80 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-cream-100" tabIndex={-1}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={boat.title ?? "Tekne"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <FontAwesomeIcon icon={faAnchor} className="text-[28px]" aria-hidden />
            <span className="text-[13px] font-medium">Fotoğraf eklenmedi</span>
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[12.5px] font-semibold text-ink shadow-sm">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[boat.status])} aria-hidden />
          {STATUS_LABELS[boat.status]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={cn("truncate text-[17px] font-bold tracking-[-0.01em]", boat.title ? "text-ink" : "text-gray-400")}>
              <Link href={href} className="hover:underline">
                {boat.title || "İsimsiz taslak"}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-[13.5px] text-gray-500">
              {type} · {updatedLabel(boat.updatedAt)}
            </p>
          </div>
          <CardMenu boat={boat} busy={busy} onRemove={onRemove} />
        </div>

        {isDraft ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="truncate text-gray-500">
                Sıradaki adım: <b className="font-semibold text-ink">{STEP_LABELS[boat.currentStep]}</b>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-gray-500">%{percent}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <InstantSwitch on={boat.approvalType === "INSTANT"} busy={busy} onToggle={onToggleInstant} />
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link
            href={href}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors",
              isDraft
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "border border-gray-300 text-ink hover:border-ink"
            )}
          >
            {isDraft ? "Kaldığın yerden devam et" : "İlanı düzenle"}
            {isDraft ? <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" aria-hidden /> : null}
          </Link>
        </div>
      </div>
    </article>
  );
}

function BoatsContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryEnabled = !authLoading && isAuthenticated;
  const { data: boats, loading, error, reload } = useMyBoats(queryEnabled);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [items, setItems] = useState<BoatListItem[] | null>(null);

  const list = items ?? boats;

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[34px]">
            Teknelerim
          </h1>
          <p className="mt-1.5 text-[15px] text-gray-500">
            İlanlarını düzenle, anında rezervasyonu yönet ve taslaklarını tamamla.
          </p>
        </div>
        <Link
          href="/boats/new"
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-brand-500 px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-600 sm:self-auto"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[13px]" aria-hidden />
          Yeni tekne ekle
        </Link>
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

      {error || actionError ? (
        <Alert variant="danger">
          <p>{error ?? actionError}</p>
          {error?.includes("Oturumunuzun süresi doldu") ? (
            <Link href="/login" className="mt-2 inline-block font-medium underline">
              Giriş sayfasına git
            </Link>
          ) : null}
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[380px] rounded-card" />
          <Skeleton className="h-[380px] rounded-card" />
          <Skeleton className="h-[380px] rounded-card" />
        </div>
      ) : !list || list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500">
            <FontAwesomeIcon icon={faAnchor} className="text-[26px]" aria-hidden />
          </span>
          <h3 className="mt-5 text-[20px] font-bold text-ink">Henüz teknen yok</h3>
          <p className="mt-2 max-w-sm text-[15px] text-gray-500">
            İlk tekneni ekle, ilanını birkaç adımda hazırla ve rezervasyon almaya başla.
          </p>
          <Link
            href="/boats/new"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-500 px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[13px]" aria-hidden />
            İlk tekneni ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((boat) => (
            <BoatCard
              key={boat.id}
              boat={boat}
              busy={busyId === boat.id}
              onToggleInstant={() => void toggleInstantBooking(boat)}
              onRemove={() => void removeBoat(boat)}
            />
          ))}
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
