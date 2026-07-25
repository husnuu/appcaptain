"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type KycDoc = Awaited<ReturnType<typeof api.listKycDocuments>>["items"][number];

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-amber-100 text-amber-700" },
  VERIFIED: { label: "Doğrulandı", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  PASSPORT: "Pasaport",
  NATIONAL_ID: "Kimlik Kartı",
  DRIVING_LICENSE: "Sürücü Belgesi",
  SELFIE: "Selfie",
  PROOF_OF_ADDRESS: "İkametgah",
};

const PROFILE_KYC_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "İşlemde", color: "text-amber-600" },
  VERIFIED: { label: "Doğrulandı", color: "text-emerald-600" },
  REJECTED: { label: "Reddedildi", color: "text-red-600" },
};

export default function KycPage() {
  const [items, setItems] = useState<KycDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<KycDoc | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.listKycDocuments({ status: statusFilter || undefined, page, limit })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setPendingCount(r.pendingCount);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, status: "VERIFIED" | "REJECTED") {
    setReviewing(true);
    try {
      await api.reviewKycDocument(id, { status, notes: reviewNote || undefined });
      setSelected(null);
      setReviewNote("");
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setReviewing(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Doğrulama</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Kaptan kimlik belgeleri inceleme kuyruğu
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount} bekliyor
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {["", "PENDING", "VERIFIED", "REJECTED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-brand-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "" ? "Tümü" : STATUS_META[s]?.label ?? s}
            {s === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white/30 px-1.5 text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Belge Türü</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Profil KYC</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Kayıt bulunamadı</td></tr>
            ) : items.map((doc) => {
              const statusMeta = STATUS_META[doc.status] ?? { label: doc.status, color: "bg-gray-100 text-gray-600" };
              const profileStatus = doc.profile.kycStatus ? PROFILE_KYC_STATUS[doc.profile.kycStatus] : null;
              return (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{doc.profile.fullName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{doc.profile.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[doc.type] ?? doc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {profileStatus ? (
                      <span className={`text-xs font-medium ${profileStatus.color}`}>{profileStatus.label}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => { setSelected(doc); setReviewNote(doc.notes ?? ""); }}
                      className="rounded-md bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      İncele
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">←</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">→</button>
          </div>
        </div>
      )}

      {/* Review panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h2 className="font-semibold text-gray-900">KYC İnceleme</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Profile info */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-1">
                <p className="font-medium text-gray-900">{selected.profile.fullName ?? "—"}</p>
                <p className="text-sm text-gray-500">{selected.profile.email ?? "—"}</p>
              </div>

              {/* Document info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Belge Türü</span>
                  <span className="text-sm font-medium text-gray-900">{TYPE_LABELS[selected.type] ?? selected.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Durum</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[selected.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_META[selected.status]?.label ?? selected.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Yükleme Tarihi</span>
                  <span className="text-sm text-gray-700">{new Date(selected.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                {selected.reviewedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">İnceleyen</span>
                    <span className="text-sm text-gray-700">{selected.reviewedBy.fullName}</span>
                  </div>
                )}
              </div>

              {/* Document preview */}
              {selected.publicUrl ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Belge</p>
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    {selected.publicUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.publicUrl} alt={selected.type} className="w-full object-contain max-h-64" />
                    ) : (
                      <a
                        href={selected.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-brand-600 hover:bg-gray-50"
                      >
                        Belgeyi Aç →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                  Belge dosyası yok
                </div>
              )}

              {/* Review note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">İnceleme Notu</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Onay veya ret nedeni…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={reviewing || selected.status === "VERIFIED"}
                  onClick={() => void decide(selected.id, "VERIFIED")}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {reviewing ? "…" : "Onayla"}
                </button>
                <button
                  type="button"
                  disabled={reviewing || selected.status === "REJECTED"}
                  onClick={() => void decide(selected.id, "REJECTED")}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {reviewing ? "…" : "Reddet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
