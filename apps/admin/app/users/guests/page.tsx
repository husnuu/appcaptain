"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Guest = Awaited<ReturnType<typeof api.listGuests>>["items"][number];

const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "active", label: "Aktif" },
  { value: "suspended", label: "Askıda" },
  { value: "banned", label: "Kalıcı Engelli" },
];

function statusBadge(guest: Guest) {
  if (guest.bannedAt)
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">Engelli</span>;
  if (guest.isSuspended)
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">Askıda</span>;
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Aktif</span>;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listGuests({
        search: search || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        country: country || undefined,
        page: p,
        limit,
      });
      setGuests(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters() {
    setPage(1);
    load(1);
  }

  async function toggleSuspend(guest: Guest) {
    const willSuspend = !guest.isSuspended && !guest.bannedAt;
    const msg = willSuspend
      ? `${guest.name} kullanıcısını askıya almak istiyor musunuz?`
      : `${guest.name} kullanıcısının askısını/engelini kaldırmak istiyor musunuz?`;
    if (!window.confirm(msg)) return;
    setActionBusy(guest.id);
    try {
      await api.suspendGuest(guest.id, { suspend: willSuspend });
      await load(page);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(null);
    }
  }

  async function permanentBan(guest: Guest) {
    if (!window.confirm(`${guest.name} kullanıcısını KALICI olarak engellemek istiyor musunuz? Bu işlem geri alınabilir.`)) return;
    setActionBusy(guest.id);
    try {
      await api.suspendGuest(guest.id, { suspend: true, permanent: true });
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
        <h1 className="text-2xl font-bold text-gray-900">Misafir Hesapları</h1>
        <span className="text-sm text-gray-500">{total} kullanıcı</span>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ad, e-posta veya telefon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ülke"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Kayıt tarihi başlangıç"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            title="Kayıt tarihi bitiş"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Filtrele
          </button>
          <button
            type="button"
            onClick={() => { setSearch(""); setStatus(""); setDateFrom(""); setDateTo(""); setCountry(""); setPage(1); setTimeout(() => load(1), 0); }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Temizle
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="py-12 text-center text-gray-400">Yükleniyor…</div>
      ) : guests.length === 0 ? (
        <div className="py-12 text-center text-gray-400">Kullanıcı bulunamadı.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Kullanıcı</th>
                <th className="px-4 py-3 text-left">Ülke</th>
                <th className="px-4 py-3 text-left">Telefon</th>
                <th className="px-4 py-3 text-left">Rezerv.</th>
                <th className="px-4 py-3 text-left">Yorum</th>
                <th className="px-4 py-3 text-left">Kayıt</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{guest.name}</div>
                    <div className="text-xs text-gray-400">{guest.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{guest.country ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{guest.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{guest._count.reservations}</td>
                  <td className="px-4 py-3 text-gray-500">{guest._count.reviews}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(guest.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">{statusBadge(guest)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/users/guests/${guest.id}`}
                        className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Detay
                      </Link>
                      {!guest.bannedAt && (
                        <button
                          type="button"
                          disabled={actionBusy === guest.id}
                          onClick={() => toggleSuspend(guest)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                            guest.isSuspended
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-orange-500 hover:bg-orange-600"
                          }`}
                        >
                          {guest.isSuspended ? "Askıyı Kaldır" : "Askıya Al"}
                        </button>
                      )}
                      {!guest.bannedAt && (
                        <button
                          type="button"
                          disabled={actionBusy === guest.id}
                          onClick={() => permanentBan(guest)}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Engelle
                        </button>
                      )}
                      {guest.bannedAt && (
                        <button
                          type="button"
                          disabled={actionBusy === guest.id}
                          onClick={() => toggleSuspend(guest)}
                          className="rounded-md bg-gray-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                          Engeli Kaldır
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
