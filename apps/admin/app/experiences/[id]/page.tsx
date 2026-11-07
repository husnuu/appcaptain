"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { EXPERIENCE_CATEGORY_LABELS, EXPERIENCE_STATUS_LABELS } from "@getyourboat/shared";
import { api, ApiError } from "../../../lib/api";

type Experience = Awaited<ReturnType<typeof api.getExperience>>["experience"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  CHANGES_REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} sa ${m} dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.getExperience(id);
      setExperience(res.experience);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(newStatus: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED") {
    if (!experience) return;
    if (newStatus !== "APPROVED" && note.trim().length < 5) {
      alert("Not en az 5 karakter olmalı.");
      return;
    }
    setActionBusy(true);
    try {
      await api.updateExperienceStatus(experience.id, {
        status: newStatus,
        note: newStatus === "APPROVED" ? undefined : note.trim(),
      });
      setNote("");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Yükleniyor…</div>;
  if (error || !experience) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error ?? "Deneyim bulunamadı"}</div>;
  }

  const canReview = experience.status === "PENDING_REVIEW";

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/experiences")}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Deneyimlere dön
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">{experience.title || "(isimsiz taslak)"}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[experience.status] ?? "bg-gray-100 text-gray-600"}`}>
              {EXPERIENCE_STATUS_LABELS[experience.status as keyof typeof EXPERIENCE_STATUS_LABELS] ?? experience.status}
            </span>
            {experience.category ? (
              <span className="text-xs text-gray-500">
                {EXPERIENCE_CATEGORY_LABELS[experience.category as keyof typeof EXPERIENCE_CATEGORY_LABELS] ?? experience.category}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Kaptan: {experience.captain.fullName ?? "—"} ({experience.captain.email ?? "—"})
          </div>
          {experience.reviewNote ? (
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Son not: {experience.reviewNote}
              {experience.reviewedAt ? (
                <span className="ml-2 text-xs text-amber-600">
                  ({new Date(experience.reviewedAt).toLocaleString("tr-TR")})
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Photos */}
          <section className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Fotoğraflar</h2>
            {experience.coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={experience.coverPhotoUrl} alt="Kapak" className="mb-3 h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="mb-3 flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
                Kapak fotoğrafı yok
              </div>
            )}
            {experience.photoUrls.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {experience.photoUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="h-20 w-full rounded-md object-cover" />
                ))}
              </div>
            ) : null}
          </section>

          {/* Description */}
          <section className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Açıklama</h2>
            <p className="mb-2 text-sm text-gray-600">{experience.shortDescription || "—"}</p>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{experience.fullDescription || "—"}</p>
            {experience.highlights.length > 0 ? (
              <ul className="mt-3 list-inside list-disc text-sm text-gray-600">
                {experience.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            ) : null}
          </section>

          {/* Logistics */}
          <section className="rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Lojistik</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400">Süre</dt><dd className="text-gray-700">{formatDuration(experience.durationMinutes)}</dd></div>
              <div><dt className="text-gray-400">Katılımcı</dt><dd className="text-gray-700">{experience.minParticipants}–{experience.maxParticipants} kişi</dd></div>
              <div><dt className="text-gray-400">Buluşma noktası</dt><dd className="text-gray-700">{experience.meetingPoint || "—"}</dd></div>
              <div><dt className="text-gray-400">Buluşma saati</dt><dd className="text-gray-700">{experience.meetingTime || "—"}</dd></div>
              <div><dt className="text-gray-400">Diller</dt><dd className="text-gray-700">{experience.languages.join(", ") || "—"}</dd></div>
              <div><dt className="text-gray-400">Fiyat</dt><dd className="text-gray-700">{Number(experience.basePrice).toLocaleString("tr-TR")} {experience.currency}</dd></div>
            </dl>
          </section>
        </div>

        {/* Review panel */}
        <aside className="h-fit rounded-card border border-gray-200/70 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">İnceleme</h2>
          {canReview ? (
            <>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Not (değişiklik isteği / red için zorunlu)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Kaptana gösterilecek not…"
                className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400 bg-white"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void changeStatus("APPROVED")}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Onayla
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void changeStatus("CHANGES_REQUESTED")}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Değişiklik İste
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void changeStatus("REJECTED")}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Bu deneyim şu anda incelemede değil, onay/red aksiyonu alınamaz.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
