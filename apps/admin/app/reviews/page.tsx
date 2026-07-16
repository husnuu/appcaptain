"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Review = Awaited<ReturnType<typeof api.listReviews>>["items"][number];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listReviews({ search: search || undefined, page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  function handleDelete() {
    if (!deleteTarget) return;
    api
      .deleteReview(deleteTarget)
      .then(() => { setDeleteTarget(null); load(); })
      .catch((e) => alert(e instanceof ApiError ? e.message : "Hata"));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Yorumlar</h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Yorum, kullanıcı veya tekne ara..."
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Tekne</th>
              <th className="px-4 py-3 text-left">Puan</th>
              <th className="px-4 py-3 text-left">Yorum</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-left">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sonuç bulunamadı</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-gray-800">{r.customer.name}</div>
                  <div className="text-xs text-gray-500">{r.customer.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-800">{r.boat.title ?? "—"}</td>
                <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{r.comment ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDeleteTarget(r.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Önceki</button>
          <span className="text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Yorumu Sil</h2>
            <p className="text-sm text-gray-600 mb-4">Bu yorumu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded border px-4 py-2 text-sm">Vazgeç</button>
              <button onClick={handleDelete} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
