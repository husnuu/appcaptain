"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Reservation = Awaited<ReturnType<typeof api.listReservations>>["items"][number];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylı",
  CANCELLED: "İptal",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function ReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listReservations({ status: status || undefined, search: search || undefined, page, limit })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCancel() {
    if (!cancelId) return;
    api
      .cancelReservation(cancelId, cancelNote || undefined)
      .then(() => {
        setCancelId(null);
        setCancelNote("");
        load();
      })
      .catch((e) => alert(e instanceof ApiError ? e.message : "Hata"));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Rezervasyonlar</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Misafir adı, e-posta veya tekne ara..."
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Misafir</th>
              <th className="px-4 py-3 text-left">Tekne</th>
              <th className="px-4 py-3 text-left">Başlangıç</th>
              <th className="px-4 py-3 text-left">Fiyat</th>
              <th className="px-4 py-3 text-left">Durum</th>
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
                  <div className="font-medium text-gray-900">{r.guestName ?? "—"}</div>
                  <div className="text-xs text-gray-500">{r.guestEmail ?? ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{r.boat.title ?? "—"}</div>
                  <div className="text-xs text-gray-500">{r.boat.owner.fullName ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {new Date(r.startDate).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {r.totalPrice != null ? `${r.totalPrice.toLocaleString("tr-TR")} ${r.currency ?? ""}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status !== "CANCELLED" && r.status !== "COMPLETED" && (
                    <button
                      onClick={() => setCancelId(r.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      İptal Et
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Önceki</button>
          <span className="text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Rezervasyonu İptal Et</h2>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="İptal notu (opsiyonel)"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setCancelId(null); setCancelNote(""); }} className="rounded border px-4 py-2 text-sm">Vazgeç</button>
              <button onClick={handleCancel} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">İptal Et</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
