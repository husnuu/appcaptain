"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "../../../lib/api";

type Review = Awaited<ReturnType<typeof api.getReview>>["review"];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-xl">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warn
  const [warnMsg, setWarnMsg] = useState("");
  const [warnBusy, setWarnBusy] = useState(false);
  const [warnSent, setWarnSent] = useState(false);

  // Busy for individual actions
  const [busy, setBusy] = useState<string | null>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  function load() {
    setLoading(true);
    api
      .getReview(id)
      .then((d) => { setReview(d.review); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function doAction(action: () => Promise<unknown>, key: string) {
    setBusy(key);
    try {
      await action();
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  async function handleWarn() {
    if (!warnMsg.trim()) return;
    setWarnBusy(true);
    try {
      await api.warnReviewer(id, warnMsg);
      setWarnSent(true);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setWarnBusy(false);
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!review) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/reviews" className="hover:text-brand-600">Yorumlar</Link>
        <span>/</span>
        <span className="text-gray-700">Yorum Detayı</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Stars rating={review.rating} />
            {review.isHidden && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">Gizli</span>
            )}
            {review.reportCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                {review.reportCount} şikayet
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy === "visibility"}
            onClick={() => doAction(() => api.setReviewVisibility(id, !review.isHidden), "visibility")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${review.isHidden ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
          >
            {review.isHidden ? "Geri Yükle" : "Gizle"}
          </button>
          {review.reportCount > 0 && (
            <button
              type="button"
              disabled={busy === "clearReport"}
              onClick={() => doAction(() => api.clearReviewReport(id), "clearReport")}
              className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              Şikayeti Temizle
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            Kalıcı Sil
          </button>
        </div>
      </div>

      {/* Review content */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Yorum İçeriği</h2>
        <p className="text-gray-800 leading-relaxed">{review.comment ?? <span className="text-gray-400 italic">Yorum metni yok</span>}</p>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoBlock title="Yorumu Yazan">
          <Link href={`/users/guests/${review.customer.id}`} className="font-medium text-brand-700 hover:underline">
            {review.customer.name}
          </Link>
          <p className="text-xs text-gray-400">{review.customer.email}</p>
        </InfoBlock>

        <InfoBlock title="Tekne / Sahip">
          <Link href={`/boats/${review.boat.id}`} className="font-medium text-gray-800 hover:underline">
            {review.boat.title ?? "—"}
          </Link>
          {review.boat.owner.fullName && (
            <Link href={`/users/${review.boat.owner.id}`} className="text-xs text-gray-400 hover:underline">
              {review.boat.owner.fullName}
            </Link>
          )}
        </InfoBlock>

        {review.reservation && (
          <InfoBlock title="Rezervasyon">
            <p className="text-sm text-gray-700">
              {new Date(review.reservation.startDate).toLocaleDateString("tr-TR")} – {new Date(review.reservation.endDate).toLocaleDateString("tr-TR")}
            </p>
            <p className="text-xs text-gray-400">{review.reservation.guests} kişi · {review.reservation.status}</p>
          </InfoBlock>
        )}
      </div>

      {/* Owner response */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-blue-800">Sahip Yanıtı</h2>
          {review.ownerResponse && (
            <div className="flex gap-2">
              {!review.ownerResponseApproved && (
                <button
                  type="button"
                  disabled={busy === "approveResponse"}
                  onClick={() => doAction(() => api.approveOwnerResponse(id), "approveResponse")}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Onayla
                </button>
              )}
              <button
                type="button"
                disabled={busy === "removeResponse"}
                onClick={() => doAction(() => api.removeOwnerResponse(id), "removeResponse")}
                className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                Kaldır
              </button>
            </div>
          )}
        </div>
        {review.ownerResponse ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              {review.ownerResponseApproved ? (
                <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs text-blue-800">Onaylı · Yayında</span>
              ) : (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Onay Bekliyor</span>
              )}
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">{review.ownerResponse}</p>
          </>
        ) : (
          <p className="text-sm text-blue-400 italic">Sahip henüz yanıt vermemiş.</p>
        )}
      </div>

      {/* Warn user */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Kullanıcıya Uyarı Gönder</h2>
        {warnSent ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Uyarı e-postası gönderildi.</p>
        ) : (
          <>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Uyarı mesajı…"
              value={warnMsg}
              onChange={(e) => setWarnMsg(e.target.value)}
            />
            <button
              type="button"
              disabled={warnBusy || !warnMsg.trim()}
              onClick={handleWarn}
              className="mt-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Uyarı Gönder
            </button>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Yorumu Kalıcı Sil</h2>
            <p className="mb-4 text-sm text-gray-600">Bu yorum veritabanından tamamen silinecek. Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button
                type="button"
                disabled={busy === "delete"}
                onClick={() => doAction(async () => { await api.deleteReview(id); window.location.href = "/reviews"; }, "delete")}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
