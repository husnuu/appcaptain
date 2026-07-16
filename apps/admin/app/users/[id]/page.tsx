"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";

type OwnerDetail = Awaited<ReturnType<typeof api.getOwner>>["profile"];

const BOAT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  ACTIVE: "Yayında",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıda",
};

const BOAT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  PAYOUT_SENT: "Transfer Edildi",
  REFUNDED: "İade",
  FAILED: "Başarısız",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  PAYOUT_SENT: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
};

const BADGE_PRESETS = [
  "Süper Tekne Sahibi",
  "Elit Sahip",
  "Doğrulanmış Sahip",
  "Öne Çıkan Kaptan",
];

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < Math.round(value) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
      ))}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </span>
  );
}

export default function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<OwnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Badge state
  const [badgeInput, setBadgeInput] = useState("");
  const [badgeResult, setBadgeResult] = useState<string | null>(null);

  // Warning state
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnMsg, setWarnMsg] = useState("");
  const [warnResult, setWarnResult] = useState<{ emailSent: boolean } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOwner(id);
      setProfile(res.profile);
      setBadgeInput(res.profile.badge ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSuspend() {
    if (!profile) return;
    const willSuspend = profile.isVerified;
    const msg = willSuspend
      ? `${profile.fullName ?? profile.email} kullanıcısını askıya almak istiyor musunuz?`
      : `${profile.fullName ?? profile.email} kullanıcısının askısını kaldırmak istiyor musunuz?`;
    if (!window.confirm(msg)) return;
    setActionBusy(true);
    try {
      await api.suspendUser(id, willSuspend);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSetBadge(badge: string | null) {
    setActionBusy(true);
    setBadgeResult(null);
    try {
      await api.setOwnerBadge(id, badge);
      setBadgeResult(badge ? `Rozet "${badge}" atandı.` : "Rozet kaldırıldı.");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleWarn() {
    if (!warnMsg.trim()) return;
    setActionBusy(true);
    setWarnResult(null);
    try {
      const res = await api.warnOwner(id, warnMsg.trim());
      setWarnResult(res);
      setWarnMsg("");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Yükleniyor…</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!profile) return null;

  const { stats } = profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button type="button" onClick={() => router.back()} className="mb-2 text-sm text-gray-400 hover:text-gray-600">
          ← Geri
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName ?? "—"}</h1>
              {profile.badge && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
                  {profile.badge}
                </span>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${profile.isVerified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {profile.isVerified ? "Aktif" : "Askıda"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.companyName && <span className="font-medium">{profile.companyName}</span>}
              {profile.address && <span>{profile.address}</span>}
              <span>Kayıt: {new Date(profile.createdAt).toLocaleDateString("tr-TR")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Toplam İlan", value: stats.boatCount },
          { label: "Toplam Kazanç", value: `€${stats.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "Platform Komisyonu", value: `€${stats.totalCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "Ortalama Puan", value: stats.avgRating !== null ? stats.avgRating.toFixed(1) + " / 5" : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Actions: suspend + badge + warn */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Suspend */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Hesap Durumu</h2>
          <button
            type="button"
            disabled={actionBusy}
            onClick={handleSuspend}
            className={`w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${
              profile.isVerified ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {profile.isVerified ? "Askıya Al" : "Askıyı Kaldır"}
          </button>
        </div>

        {/* Badge */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Rozet Ata</h2>
          <div className="flex gap-2">
            <input
              list="badge-presets"
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              placeholder="Rozet adı..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <datalist id="badge-presets">
              {BADGE_PRESETS.map((b) => <option key={b} value={b} />)}
            </datalist>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleSetBadge(badgeInput.trim() || null)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Ata
            </button>
          </div>
          {profile.badge && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleSetBadge(null)}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Rozeti Kaldır
            </button>
          )}
          {badgeResult && <p className="mt-2 text-xs text-green-600">{badgeResult}</p>}
        </div>

        {/* Warn */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Uyarı Gönder</h2>
          {!warnOpen ? (
            <button
              type="button"
              onClick={() => setWarnOpen(true)}
              className="w-full rounded-lg border border-orange-300 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              Uyarı Yaz
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={warnMsg}
                onChange={(e) => setWarnMsg(e.target.value)}
                rows={3}
                placeholder="Uyarı mesajı..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actionBusy || !warnMsg.trim()}
                  onClick={handleWarn}
                  className="flex-1 rounded-lg bg-orange-500 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  Gönder
                </button>
                <button
                  type="button"
                  onClick={() => { setWarnOpen(false); setWarnMsg(""); setWarnResult(null); }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
              {warnResult !== null && (
                <p className={`text-xs ${warnResult.emailSent ? "text-green-600" : "text-orange-500"}`}>
                  {warnResult.emailSent ? "Uyarı e-postası gönderildi." : "Kaydedildi, ancak e-posta gönderilemedi (SMTP yapılandırılmamış)."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Boats */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            İlanlar
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">({stats.boatCount} toplam)</span>
          </h2>
        </div>
        {profile.boats.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Henüz ilan yok.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">İlan</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Rezervasyon</th>
                <th className="px-4 py-3 text-left">Puan</th>
                <th className="px-4 py-3 text-left">Eklenme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profile.boats.map((boat) => (
                <tr key={boat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/boats/${boat.id}`} className="font-medium text-brand-700 hover:underline">
                      {boat.title ?? "(İsimsiz)"}
                    </Link>
                    {boat.boatTypeKey && (
                      <div className="text-xs text-gray-400">{boat.boatTypeKey}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BOAT_STATUS_COLORS[boat.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {BOAT_STATUS_LABELS[boat.status] ?? boat.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{boat.bookingCount}</td>
                  <td className="px-4 py-3"><Stars value={boat.avgRating} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(boat.createdAt).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Payments */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Son Ödemeler
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">({stats.bookingCount} toplam rezervasyon)</span>
          </h2>
        </div>
        {profile.recentPayments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Henüz ödeme yok.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Tekne</th>
                <th className="px-4 py-3 text-left">Tutar</th>
                <th className="px-4 py-3 text-left">Komisyon</th>
                <th className="px-4 py-3 text-left">Net</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profile.recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{p.boatName}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.currency} {p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-red-500">−{p.currency} {p.commission.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 font-medium text-green-700">{p.currency} {p.netAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
