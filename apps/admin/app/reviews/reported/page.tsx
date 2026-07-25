"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Review = Awaited<ReturnType<typeof api.listReviews>>["items"][number];

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

export default function ReportedReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warn modal
  const [warnTarget, setWarnTarget] = useState<Review | null>(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [warnBusy, setWarnBusy] = useState(false);
  const [warnSent, setWarnSent] = useState(false);

  // Action busy states
  const [busyId, setBusyId] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listReviews({ reported: true, page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function toggleVisibility(id: string, currentlyHidden: boolean) {
    setBusyId(id);
    try {
      await api.setReviewVisibility(id, !currentlyHidden);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  async function clearReport(id: string) {
    setBusyId(id);
    try {
      await api.clearReviewReport(id);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setBusyId(null);
    }
  }

  async function handleWarn() {
    if (!warnTarget || !warnMsg.trim()) return;
    setWarnBusy(true);
    try {
      await api.warnReviewer(warnTarget.id, warnMsg);
      setWarnSent(true);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setWarnBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Şikayet Edilen Yorumlar</h1>
        <span className="text-sm text-gray-400">{total} yorum</span>
      </div>

      {total === 0 && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-gray-400">Şikayet edilen yorum bulunmuyor.</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {items.length > 0 && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Yükleniyor…</p>
          ) : items.map((r) => (
            <div key={r.id} className={`rounded-xl border bg-white p-5 shadow-sm ${r.isHidden ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Stars rating={r.rating} />
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {r.reportCount} şikayet
                    </span>
                    {r.isHidden && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">Gizli</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-800">{r.comment ?? <span className="text-gray-400 italic">Yorum yok</span>}</p>

                  {r.ownerResponse && (
                    <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                      <p className="text-xs font-medium text-blue-700 mb-0.5">
                        Sahip Yanıtı {r.ownerResponseApproved ? "(Onaylı)" : "(Onay Bekliyor)"}
                      </p>
                      <p className="text-xs text-blue-800">{r.ownerResponse}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <Link href={`/users/guests/${r.customer.id}`} className="hover:text-brand-600 hover:underline">
                      {r.customer.name} ({r.customer.email})
                    </Link>
                    <span>→</span>
                    <Link href={`/boats/${r.boat.id}`} className="hover:text-brand-600 hover:underline">
                      {r.boat.title ?? "Tekne"}
                    </Link>
                    {r.boat.owner.fullName && (
                      <>
                        <span>·</span>
                        <Link href={`/users/${r.boat.owner.id}`} className="hover:text-brand-600 hover:underline">
                          {r.boat.owner.fullName}
                        </Link>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link href={`/reviews/${r.id}`} className="rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 text-center">
                    Detay
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => toggleVisibility(r.id, r.isHidden)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${r.isHidden ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                  >
                    {r.isHidden ? "Geri Yükle" : "Gizle"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => { setWarnTarget(r); setWarnMsg(""); setWarnSent(false); }}
                    className="rounded-md bg-yellow-50 px-2.5 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                  >
                    Uyar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => clearReport(r.id)}
                    className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                  >
                    Şikayeti Temizle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">←</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">→</button>
          </div>
        </div>
      )}

      {/* Warn modal */}
      {warnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Kullanıcıyı Uyar</h2>
            <p className="mb-3 text-sm text-gray-500">{warnTarget.customer.name} — {warnTarget.customer.email}</p>
            {warnSent ? (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Uyarı e-postası gönderildi.</p>
            ) : (
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={4}
                placeholder="Uyarı mesajı…"
                value={warnMsg}
                onChange={(e) => setWarnMsg(e.target.value)}
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setWarnTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                {warnSent ? "Kapat" : "Vazgeç"}
              </button>
              {!warnSent && (
                <button type="button" disabled={warnBusy || !warnMsg.trim()} onClick={handleWarn} className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
                  Gönder
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
