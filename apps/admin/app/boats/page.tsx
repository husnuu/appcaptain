"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "../../lib/api";

type Boat = Awaited<ReturnType<typeof api.listBoats>>["items"][number];

const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "DRAFT", label: "Taslak" },
  { value: "PENDING_REVIEW", label: "İncelemede" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "REJECTED", label: "Reddedildi" },
  { value: "SUSPENDED", label: "Askıya Alındı" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  ACTIVE: "Aktif",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıya Alındı",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
};

export default function AdminBoatsPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [boatTypeKey, setBoatTypeKey] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [boatTypes, setBoatTypes] = useState<{ key: string; label: string }[]>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Fetch available boat types once on mount
  useEffect(() => {
    api.getBoatTypes().then((res) => setBoatTypes(res.types)).catch(() => {});
  }, []);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      setSelectedIds(new Set());
      try {
        const res = await api.listBoats({
          status: status || undefined,
          search: search || undefined,
          boatTypeKey: boatTypeKey || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page: p,
          limit,
        });
        setBoats(res.items);
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Yüklenemedi");
      } finally {
        setLoading(false);
      }
    },
    [status, search, boatTypeKey, dateFrom, dateTo]
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [status, boatTypeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySearch() {
    setPage(1);
    load(1);
  }

  async function changeStatus(id: string, newStatus: string, rejectionReason?: string) {
    setActionBusy(id);
    try {
      await api.updateBoatStatus(id, { status: newStatus, rejectionReason });
      await load(page);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(null);
    }
  }

  async function bulkChangeStatus(newStatus: string) {
    if (selectedIds.size === 0) return;
    let rejectionReason: string | undefined;
    if (newStatus === "REJECTED") {
      const reason = window.prompt("Reddetme sebebi (toplu):");
      if (reason === null) return;
      rejectionReason = reason;
    }
    setBulkBusy(true);
    try {
      const res = await api.bulkBoatStatus({
        ids: Array.from(selectedIds),
        status: newStatus,
        rejectionReason,
      });
      await load(page);
      alert(`${res.updated} ilan güncellendi.`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Toplu işlem başarısız");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} ilanı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.bulkDeleteBoats(Array.from(selectedIds));
      await load(page);
      alert(`${res.deleted} ilan silindi.`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silme işlemi başarısız");
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (boats.every((b) => selectedIds.has(b.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(boats.map((b) => b.id)));
    }
  }

  const allSelected = boats.length > 0 && boats.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">İlan Yönetimi</h1>
        <span className="text-sm text-gray-500">{total} ilan</span>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="İlan adı, kaptan adı veya ID ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
            className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Boat type */}
          <select
            value={boatTypeKey}
            onChange={(e) => setBoatTypeKey(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Tekne Tipleri</option>
            {boatTypes.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          {/* Search button */}
          <button
            type="button"
            onClick={applySearch}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ara
          </button>
        </div>

        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Tarih aralığı:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕ Temizle
            </button>
          )}
          <button
            type="button"
            onClick={applySearch}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Filtrele
          </button>
          <span className="text-xs text-gray-400 italic">
            Bölge ve fiyat filtresi: yakında
          </span>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} ilan seçildi
          </span>
          <div className="ml-2 flex gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkChangeStatus("ACTIVE")}
              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkChangeStatus("SUSPENDED")}
              className="rounded-md bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Pasife Al
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={bulkDelete}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Sil
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-blue-500 hover:text-blue-700"
          >
            Seçimi temizle
          </button>
        </div>
      )}

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="py-12 text-center text-gray-400">Yükleniyor…</div>
      ) : boats.length === 0 ? (
        <div className="py-12 text-center text-gray-400">İlan bulunamadı.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">İlan</th>
                <th className="px-4 py-3 text-left">Kaptan</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Oluşturulma</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boats.map((boat) => (
                <tr
                  key={boat.id}
                  className={`hover:bg-gray-50 ${selectedIds.has(boat.id) ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(boat.id)}
                      onChange={() => toggleSelect(boat.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{boat.title ?? "(isimsiz)"}</div>
                    <div className="text-xs text-gray-400">{boat.boatTypeKey ?? "—"}</div>
                    <div className="text-xs text-gray-300 font-mono">{boat.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{boat.owner.fullName ?? "—"}</div>
                    <div className="text-xs text-gray-400">{boat.owner.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[boat.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUS_LABELS[boat.status] ?? boat.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(boat.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {boat.status === "PENDING_REVIEW" && (
                        <>
                          <button
                            type="button"
                            disabled={actionBusy === boat.id}
                            onClick={() => changeStatus(boat.id, "ACTIVE")}
                            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            disabled={actionBusy === boat.id}
                            onClick={() => {
                              const reason = window.prompt("Reddetme sebebi:");
                              if (reason !== null) changeStatus(boat.id, "REJECTED", reason);
                            }}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reddet
                          </button>
                        </>
                      )}
                      {boat.status === "ACTIVE" && (
                        <button
                          type="button"
                          disabled={actionBusy === boat.id}
                          onClick={() => changeStatus(boat.id, "SUSPENDED")}
                          className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          Askıya Al
                        </button>
                      )}
                      {boat.status === "SUSPENDED" && (
                        <button
                          type="button"
                          disabled={actionBusy === boat.id}
                          onClick={() => changeStatus(boat.id, "ACTIVE")}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Aktifleştir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
