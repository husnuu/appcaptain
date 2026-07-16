"use client";

import Link from "next/link";
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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  PAYOUT_SENT: "Transfer",
  REFUNDED: "İade",
  FAILED: "Başarısız",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-600",
  PAID: "bg-emerald-50 text-emerald-700",
  PAYOUT_SENT: "bg-blue-50 text-blue-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-50 text-red-600",
};

const RENTAL_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Saatlik",
  DAILY: "Günlük",
  WEEKLY: "Haftalık",
  STAY: "Konaklama",
};

export default function ReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listReservations({
        status: status || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
      })
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [status, search, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    if (!cancelId) return;
    setCancelBusy(true);
    try {
      await api.cancelReservation(cancelId, cancelNote || undefined);
      setCancelId(null);
      setCancelNote("");
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setCancelBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
        <span className="text-sm text-gray-500">{total} rezervasyon</span>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Misafir adı, e-posta veya tekne ara..."
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
          />
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Başlangıç tarihi (başından)"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Başlangıç tarihi (sonuna)"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Tarihi Temizle
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Misafir</th>
              <th className="px-4 py-3 text-left">Tekne / Sahip</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-left">Tür</th>
              <th className="px-4 py-3 text-left">Tutar</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Ödeme</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{r.guestName ?? "—"}</div>
                  <div className="text-xs text-gray-400">{r.guestEmail ?? ""}</div>
                  {r.guestCount && <div className="text-xs text-gray-400">{r.guestCount} kişi</div>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/boats/${r.boat.id}`} className="font-medium text-brand-700 hover:underline">
                    {r.boat.title ?? "—"}
                  </Link>
                  <div className="text-xs text-gray-400">{r.boat.owner.fullName ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  <div>{new Date(r.startDate).toLocaleDateString("tr-TR")}</div>
                  {r.endDate && (
                    <div className="text-xs text-gray-400">→ {new Date(r.endDate).toLocaleDateString("tr-TR")}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {RENTAL_TYPE_LABELS[r.rentalType] ?? r.rentalType}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {r.totalPrice != null ? `${r.currency ?? ""} ${r.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.bookingPayment ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[r.bookingPayment.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {PAYMENT_STATUS_LABELS[r.bookingPayment.status] ?? r.bookingPayment.status}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/reservations/${r.id}`}
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Detay
                    </Link>
                    {r.status !== "CANCELLED" && r.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => setCancelId(r.id)}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        İptal
                      </button>
                    )}
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

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Rezervasyonu İptal Et</h2>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="İptal notu (opsiyonel)"
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setCancelId(null); setCancelNote(""); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={cancelBusy}
                onClick={handleCancel}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
