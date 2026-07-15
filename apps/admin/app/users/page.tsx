"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type User = Awaited<ReturnType<typeof api.listUsers>>["items"][number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
      const res = await api.listUsers({ search: search || undefined, page: p, limit });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleSuspend(user: User) {
    const isSuspended = !user.isVerified;
    const confirmMsg = isSuspended
      ? `${user.fullName ?? user.email} kullanıcısının askıyı kaldırmak istediğinizden emin misiniz?`
      : `${user.fullName ?? user.email} kullanıcısını askıya almak istediğinizden emin misiniz?`;
    if (!window.confirm(confirmMsg)) return;
    setActionBusy(user.id);
    try {
      await api.suspendUser(user.id, !isSuspended);
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
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
        <span className="text-sm text-gray-500">{total} kullanıcı</span>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Ad, e-posta veya telefon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(1); } }}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={() => { setPage(1); load(1); }}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Ara
        </button>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="py-12 text-center text-gray-400">Yükleniyor…</div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-gray-400">Kullanıcı bulunamadı.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Kullanıcı</th>
                <th className="px-4 py-3 text-left">Telefon</th>
                <th className="px-4 py-3 text-left">İlanlar</th>
                <th className="px-4 py-3 text-left">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.fullName ?? "—"}</div>
                    <div className="text-xs text-gray-400">{user.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{user._count.boats}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.isVerified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.isVerified ? "Aktif" : "Askıda"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={actionBusy === user.id}
                      onClick={() => toggleSuspend(user)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${user.isVerified ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                      {user.isVerified ? "Askıya Al" : "Askıyı Kaldır"}
                    </button>
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
