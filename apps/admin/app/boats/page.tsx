"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Boat = Awaited<ReturnType<typeof api.listBoats>>["items"][number];

const STATUS_OPTIONS = [
  { value: "", label: "Tümü" },
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
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listBoats({ status: status || undefined, search: search || undefined, page: p, limit });
      setBoats(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); setPage(1); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">İlan Yönetimi</h1>
        <span className="text-sm text-gray-500">{total} ilan</span>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="İlan adı veya kaptan ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(1); } }}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

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
                <th className="px-4 py-3 text-left">İlan</th>
                <th className="px-4 py-3 text-left">Kaptan</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Güncellenme</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boats.map((boat) => (
                <tr key={boat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{boat.title ?? "(isimsiz)"}</div>
                    <div className="text-xs text-gray-400">{boat.boatTypeKey ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{boat.owner.fullName ?? "—"}</div>
                    <div className="text-xs text-gray-400">{boat.owner.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[boat.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[boat.status] ?? boat.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(boat.updatedAt).toLocaleDateString("tr-TR")}
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
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
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
