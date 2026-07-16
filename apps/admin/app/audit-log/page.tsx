"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type LogEntry = Awaited<ReturnType<typeof api.listAuditLog>>["items"][number];

export default function AuditLogPage() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 50;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listAuditLog({ action: actionFilter || undefined, page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [actionFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Denetim Kaydı</h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="İşlem adı filtrele (ör: BOAT_STATUS_CHANGED)"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        />
        <span className="self-center text-sm text-gray-500">{total} kayıt</span>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">İşlem</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Hedef</th>
              <th className="px-4 py-3 text-left">IP</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-left">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Kayıt bulunamadı</td></tr>
            ) : items.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 [&+tr[data-meta]]:bg-gray-50">
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-gray-800 text-xs">{log.admin.fullName}</div>
                  <div className="text-gray-400 text-xs">{log.admin.role}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {log.targetType && <span>{log.targetType}</span>}
                  {log.targetId && <span className="ml-1 text-gray-400">#{log.targetId.slice(0, 8)}</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{log.ip ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </td>
                <td className="px-4 py-2.5">
                  {log.metadata && (
                    <button
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expanded === log.id ? "Gizle" : "Göster"}
                    </button>
                  )}
                  {expanded === log.id && (
                    <pre className="mt-1 text-xs text-gray-700 overflow-auto max-h-40 bg-gray-100 rounded p-2">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
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
    </div>
  );
}
