"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

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

export default function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [hidden, setHidden] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warn modal
  const [warnTarget, setWarnTarget] = useState<Review | null>(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [warnBusy, setWarnBusy] = useState(false);
  const [warnSent, setWarnSent] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listReviews({
        search: search || undefined,
        minRating: minRating ? Number(minRating) : undefined,
        maxRating: maxRating ? Number(maxRating) : undefined,
        hidden: hidden === "true" ? true : hidden === "false" ? false : undefined,
        page,
        limit,
      })
      .then((r) => { setItems(r.items); setTotal(r.total); setReportedCount(r.reportedCount); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [search, minRating, maxRating, hidden, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleVisibility(id: string, currentlyHidden: boolean) {
    try {
      await api.setReviewVisibility(id, !currentlyHidden);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.deleteReview(deleteTarget);
      setDeleteTarget(null);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setDeleteBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Yorumlar</h1>
        <div className="flex items-center gap-3">
          {reportedCount > 0 && (
            <Link href="/reviews/reported" className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200">
              {reportedCount} şikayet
            </Link>
          )}
          <span className="text-sm text-gray-400">{total} yorum</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Yorum, kullanıcı veya tekne ara…"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={(e) => { if (e.key === "Enter") load(); }}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={minRating}
          onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
        >
          <option value="">Min Puan</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={maxRating}
          onChange={(e) => { setMaxRating(e.target.value); setPage(1); }}
        >
          <option value="">Max Puan</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={hidden}
          onChange={(e) => { setHidden(e.target.value); setPage(1); }}
        >
          <option value="">Tüm Görünürlük</option>
          <option value="false">Görünür</option>
          <option value="true">Gizli</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Tekne / Sahip</th>
              <th className="px-4 py-3 text-left">Puan</th>
              <th className="px-4 py-3 text-left">Yorum</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className={`hover:bg-gray-50 ${r.isHidden ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/users/guests/${r.customer.id}`} className="font-medium text-brand-700 hover:underline">
                    {r.customer.name}
                  </Link>
                  <div className="text-xs text-gray-400">{r.customer.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/boats/${r.boat.id}`} className="text-gray-800 hover:underline">
                    {r.boat.title ?? "—"}
                  </Link>
                  {r.boat.owner.fullName && (
                    <div className="text-xs text-gray-400">
                      <Link href={`/users/${r.boat.owner.id}`} className="hover:underline">{r.boat.owner.fullName}</Link>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><Stars rating={r.rating} /></td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="truncate text-gray-700">{r.comment ?? <span className="text-gray-300">—</span>}</p>
                  {r.ownerResponse && (
                    <p className="mt-0.5 truncate text-xs text-blue-600">
                      Sahip: {r.ownerResponseApproved ? "✓" : "⏳"} {r.ownerResponse}
                    </p>
                  )}
                  {r.reportCount > 0 && (
                    <span className="mt-0.5 inline-block rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                      {r.reportCount} şikayet
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {r.isHidden ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Gizli</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Görünür</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/reviews/${r.id}`} className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
                      Detay
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(r.id, r.isHidden)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${r.isHidden ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                    >
                      {r.isHidden ? "Geri Yükle" : "Gizle"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setWarnTarget(r); setWarnMsg(""); setWarnSent(false); }}
                      className="rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                    >
                      Uyar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r.id)}
                      className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Yorumu Sil</h2>
            <p className="mb-4 text-sm text-gray-600">Bu yorum kalıcı olarak silinecek. Geri alınamaz.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button type="button" disabled={deleteBusy} onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
