"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ExperienceListItemDTO } from "@getyourboat/shared";
import { ExperienceStatus } from "@getyourboat/shared";
import {
  Button,
  FontAwesomeIcon,
  cn,
  faClock,
  faEye,
  faPenToSquare,
  faPlus,
  faStar,
  faTrash,
  faUsers,
} from "@getyourboat/ui";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";
import { EXPERIENCE_CATEGORY_LABELS, EXPERIENCE_STATUS_LABELS } from "../../lib/experience";
import { Alert, Modal } from "../../components/ui";

/** Durum rozeti renkleri — Teknelerim kartlarıyla uyumlu. */
const STATUS_BADGE_STYLES: Record<ExperienceStatus, string> = {
  [ExperienceStatus.DRAFT]: "bg-[#FEF3C7] text-[#92400E]",
  [ExperienceStatus.PENDING_REVIEW]: "bg-[#DBEAFE] text-[#1D4ED8]",
  [ExperienceStatus.CHANGES_REQUESTED]: "bg-[#FEF3C7] text-[#92400E]",
  [ExperienceStatus.APPROVED]: "bg-[#D1FAE5] text-[#065F46]",
  [ExperienceStatus.ACTIVE]: "bg-[#D1FAE5] text-[#065F46]",
  [ExperienceStatus.PAUSED]: "bg-[#F1F5F9] text-[#475569]",
  [ExperienceStatus.REJECTED]: "bg-[#FEE2E2] text-[#991B1B]",
};

function formatDuration(minutes: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} sa ${m} dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}

function ExperienceCard({
  exp,
  busy,
  onEdit,
  onToggle,
  onDelete,
  canToggle,
}: {
  exp: ExperienceListItemDTO;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  canToggle: boolean;
}) {
  const isDraft = exp.status === ExperienceStatus.DRAFT;
  const duration = formatDuration(exp.durationMinutes);
  const percent = Math.max(5, exp.completionPercent);

  return (
    <div className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Sol: Thumbnail */}
      <div className="relative flex w-36 shrink-0 items-center justify-center bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2]">
        {exp.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exp.coverPhotoUrl}
            alt={exp.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={faStar} className="text-[32px] text-brand-500 opacity-60" />
        )}
        {exp.category ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-primary-700 backdrop-blur-sm">
            {EXPERIENCE_CATEGORY_LABELS[exp.category]}
          </span>
        ) : null}
      </div>

      {/* Sağ: İçerik */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="truncate text-base font-semibold leading-tight text-gray-900">
              {exp.title || "İsimsiz taslak"}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                STATUS_BADGE_STYLES[exp.status]
              )}
            >
              {EXPERIENCE_STATUS_LABELS[exp.status]}
            </span>
          </div>

          {exp.shortDescription ? (
            <p className="mb-3 line-clamp-1 text-sm text-gray-500">{exp.shortDescription}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {duration ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FontAwesomeIcon icon={faClock} className="text-[11px]" aria-hidden />
                {duration}
              </span>
            ) : null}
            {exp.maxParticipants > 0 ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FontAwesomeIcon icon={faUsers} className="text-[11px]" aria-hidden />
                Maks. {exp.maxParticipants} kişi
              </span>
            ) : null}
            {exp.basePrice > 0 ? (
              <span className="text-xs font-semibold text-brand-600">
                {exp.basePrice.toLocaleString("tr-TR")} {exp.currency} / kişi
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          {isDraft ? (
            <div className="max-w-[180px] flex-1">
              <div className="mb-1 flex justify-between text-[10px] text-gray-400">
                <span>Tamamlanma</span>
                <span>{exp.completionPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: exp.completionPercent >= 100 ? "#10B981" : "#0097A7",
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {exp.status === ExperienceStatus.ACTIVE ? (
              <Link
                href={`/experiences/${exp.id}/preview`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                <FontAwesomeIcon icon={faEye} className="text-[12px]" aria-hidden />
                Önizle
              </Link>
            ) : null}
            {canToggle ? (
              <button
                type="button"
                disabled={busy}
                onClick={onToggle}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                {exp.status === ExperienceStatus.ACTIVE ? "Duraklat" : "Yayına al"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-full border-2 border-brand-500 px-4 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-[12px]" aria-hidden />
              Düzenle
            </button>
            {exp.status !== ExperienceStatus.ACTIVE ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                title="Sil"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[13px]" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperiencesContent() {
  const router = useRouter();
  const [items, setItems] = useState<ExperienceListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceListItemDTO | null>(null);

  async function load() {
    try {
      const data = await api.myExperiences();
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deneyimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createNew() {
    setCreating(true);
    setError(null);
    try {
      const exp = await api.createExperience();
      router.push(`/experiences/${exp.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deneyim oluşturulamadı");
      setCreating(false);
    }
  }

  async function toggleStatus(item: ExperienceListItemDTO) {
    setBusyId(item.id);
    try {
      const next =
        item.status === ExperienceStatus.ACTIVE
          ? ExperienceStatus.PAUSED
          : ExperienceStatus.ACTIVE;
      await api.toggleExperienceStatus(item.id, next);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Durum güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const item = deleteTarget;
    if (!item) return;
    setBusyId(item.id);
    try {
      await api.deleteExperience(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Silinemedi");
    } finally {
      setBusyId(null);
    }
  }

  const toggleable = new Set<ExperienceStatus>([
    ExperienceStatus.APPROVED,
    ExperienceStatus.ACTIVE,
    ExperienceStatus.PAUSED,
  ]);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-gray-900">Deneyimlerim</h1>
          <p className="mt-1 text-sm text-gray-500">Tekneden bağımsız tur ve aktivite ilanları</p>
        </div>
        <Button onClick={() => void createNew()} disabled={creating}>
          <FontAwesomeIcon icon={faPlus} className="mr-2 text-[14px]" aria-hidden />
          {creating ? "Oluşturuluyor…" : "Yeni Deneyim Ekle"}
        </Button>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#F8FAFC] py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E0F7FA]">
            <FontAwesomeIcon icon={faStar} className="text-[28px] text-brand-500" aria-hidden />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-700">Henüz deneyim yok</h3>
          <p className="mb-6 max-w-xs text-center text-sm text-gray-400">
            Tekne turu, su sporları veya gün batımı aktivitesi gibi bağımsız deneyimler
            ekleyebilirsin.
          </p>
          <Button onClick={() => void createNew()} disabled={creating}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 text-[14px]" aria-hidden />
            İlk Deneyimini Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <ExperienceCard
              key={item.id}
              exp={item}
              busy={busyId === item.id}
              canToggle={toggleable.has(item.status)}
              onEdit={() => router.push(`/experiences/${item.id}`)}
              onToggle={() => void toggleStatus(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Deneyimi sil"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={busyId === deleteTarget?.id}
              onClick={() => void confirmDelete()}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              Evet, sil
            </button>
          </>
        }
      >
        <p className="text-body-sm text-gray-600">
          &quot;{deleteTarget?.title || "Bu deneyimi"}&quot; kalıcı olarak silmek istediğine emin
          misin? Bu işlem geri alınamaz.
        </p>
      </Modal>
    </>
  );
}

export default function ExperiencesPage() {
  return (
    <AppShell active="experiences">
      <ExperiencesContent />
    </AppShell>
  );
}
