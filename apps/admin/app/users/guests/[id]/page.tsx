"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../../lib/api";

type GuestDetail = Awaited<ReturnType<typeof api.getGuest>>["user"];

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylı",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
};

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-green-100 text-green-700",
};

function StatusBadge({ user }: { user: GuestDetail }) {
  if (user.bannedAt)
    return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700">Kalıcı Engelli</span>;
  if (user.isSuspended)
    return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-700">Askıda</span>;
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700">Aktif</span>;
}

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [resetResult, setResetResult] = useState<{ emailSent: boolean } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGuest(id);
      setUser(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSuspend(suspend: boolean, permanent = false) {
    if (!user) return;
    const msg = !suspend
      ? `${user.name} kullanıcısının askısını/engelini kaldırmak istiyor musunuz?`
      : permanent
      ? `${user.name} kullanıcısını KALICI olarak engellemek istiyor musunuz?`
      : `${user.name} kullanıcısını askıya almak istiyor musunuz?`;
    if (!window.confirm(msg)) return;
    setActionBusy(true);
    try {
      await api.suspendGuest(id, { suspend, permanent });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    if (!window.confirm(`${user.name} kullanıcısına şifre sıfırlama e-postası gönderilsin mi?`)) return;
    setActionBusy(true);
    try {
      const res = await api.resetGuestPassword(id);
      setResetResult(res);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Yükleniyor…</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 text-sm text-gray-400 hover:text-gray-600"
          >
            ← Geri
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <StatusBadge user={user} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span>{user.email}</span>
            {user.phone && <span>{user.phone}</span>}
            {user.country && <span>{user.country}</span>}
            <span>Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Rezervasyon", value: user.stats.reservationCount },
          { label: "Yorum", value: user.stats.reviewCount },
          { label: "Toplam Harcama", value: `€${user.stats.totalSpending.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Status Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Hesap İşlemleri</h2>
        <div className="flex flex-wrap gap-3">
          {user.bannedAt ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleSuspend(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Engeli Kaldır
            </button>
          ) : user.isSuspended ? (
            <>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => handleSuspend(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Askıyı Kaldır
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => handleSuspend(true, true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Kalıcı Engelle
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => handleSuspend(true, false)}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                Askıya Al
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => handleSuspend(true, true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Kalıcı Engelle
              </button>
            </>
          )}
          <button
            type="button"
            disabled={actionBusy}
            onClick={handleResetPassword}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Şifre Sıfırlama Gönder
          </button>
        </div>
        {resetResult !== null && (
          <p className={`mt-3 text-sm ${resetResult.emailSent ? "text-green-600" : "text-orange-500"}`}>
            {resetResult.emailSent
              ? "Şifre sıfırlama e-postası gönderildi."
              : "Token oluşturuldu ancak e-posta gönderilemedi (SMTP yapılandırılmamış)."}
          </p>
        )}
      </div>

      {/* Reservation History */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Rezervasyon Geçmişi
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">({user.stats.reservationCount} toplam)</span>
          </h2>
        </div>
        {user.reservations.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Henüz rezervasyon yok.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Tekne</th>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-left">Misafir</th>
                <th className="px-4 py-3 text-left">Tutar</th>
                <th className="px-4 py-3 text-left">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {user.reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/boats/${r.boat.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.boat.title ?? r.boat.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.startDate).toLocaleDateString("tr-TR")} –{" "}
                    {new Date(r.endDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.guests}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.totalPrice ? `€${Number(r.totalPrice).toLocaleString("tr-TR")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RESERVATION_STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {RESERVATION_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reviews */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Değerlendirmeler
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">({user.stats.reviewCount} toplam)</span>
          </h2>
        </div>
        {user.reviews.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Henüz değerlendirme yok.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {user.reviews.map((review) => (
              <li key={review.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/boats/${review.boat.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                      {review.boat.title ?? review.boat.id}
                    </Link>
                    {review.comment && (
                      <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
