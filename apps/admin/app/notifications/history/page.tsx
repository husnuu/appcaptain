"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Campaign = Awaited<ReturnType<typeof api.listCampaigns>>["items"][number];
type CampaignDetail = Awaited<ReturnType<typeof api.getCampaign>>["campaign"];

const CHANNEL_LABELS: Record<string, string> = { EMAIL: "E-posta", PUSH: "Push", SMS: "SMS" };
const TARGET_LABELS: Record<string, string> = {
  ALL: "Tümü",
  CAPTAIN: "Kaptanlar",
  OWNER: "Tekne Sahipleri",
  GUEST: "Misafirler",
};

function OpenRateBar({ rate, count, total }: { rate: number | null; count: number; total: number }) {
  if (total === 0) return <span className="text-xs text-gray-300">—</span>;
  const pct = rate ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 rounded-full bg-gray-100 h-1.5">
        <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        %{pct} ({count}/{total})
      </span>
    </div>
  );
}

export default function NotificationHistoryPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.listCampaigns({ page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const d = await api.getCampaign(id);
      setSelected(d.campaign);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gönderim Geçmişi</h1>
        <span className="text-sm text-gray-400">{total} kampanya</span>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Konu</th>
              <th className="px-4 py-3 text-left">Kanal</th>
              <th className="px-4 py-3 text-left">Hedef</th>
              <th className="px-4 py-3 text-right">Alıcı</th>
              <th className="px-4 py-3 text-left">Açılma Oranı</th>
              <th className="px-4 py-3 text-left">Gönderen</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Henüz kampanya gönderilmemiş</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-gray-900 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400">#{c.id.slice(-8)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {CHANNEL_LABELS[c.channel] ?? c.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {TARGET_LABELS[c.targetGroup] ?? c.targetGroup}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{c.recipientCount}</td>
                <td className="px-4 py-3">
                  <OpenRateBar rate={c.openRate} count={c.openCount} total={c._count.deliveries} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.admin.fullName}</td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(c.sentAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={detailLoading}
                    onClick={() => openDetail(c.id)}
                    className="rounded-md bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Aç
                  </button>
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

      {/* Campaign detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 sm:items-start sm:pt-0" onClick={() => setSelected(null)}>
          <div
            className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900 truncate max-w-xs">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">#{selected.id.slice(-8)}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{CHANNEL_LABELS[selected.channel] ?? selected.channel}</span>
                  <span className="text-xs text-gray-400">{TARGET_LABELS[selected.targetGroup] ?? selected.targetGroup}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Alıcı</p>
                  <p className="text-xl font-bold text-gray-900">{selected.recipientCount}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Teslim</p>
                  <p className="text-xl font-bold text-gray-900">{selected.deliveries.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-50 bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Açılma</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {selected.openRate !== null ? `%${selected.openRate}` : "—"}
                  </p>
                  <p className="text-xs text-emerald-600">{selected.openCount} kişi</p>
                </div>
              </div>

              {/* Message body */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Mesaj İçeriği</p>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selected.body}
                </div>
              </div>

              {/* Delivery list */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Alıcı Listesi ({selected.deliveries.length})
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selected.deliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                      <div>
                        <p className="text-sm text-gray-800">{d.recipientName ?? d.recipientEmail}</p>
                        {d.recipientName && <p className="text-xs text-gray-400">{d.recipientEmail}</p>}
                      </div>
                      {d.openedAt ? (
                        <span className="text-xs text-emerald-600 whitespace-nowrap">
                          ✓ {new Date(d.openedAt).toLocaleDateString("tr-TR")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Gönderen: {selected.admin.fullName} · {new Date(selected.sentAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
