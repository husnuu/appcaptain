"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Payment = Awaited<ReturnType<typeof api.listPayments>>["items"][number];
type Summary = Awaited<ReturnType<typeof api.listPayments>>["summary"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylı",
  CANCELLED: "İptal",
  REJECTED: "Reddedildi",
  COMPLETED: "Tamamlandı",
};

export default function FinancePage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingOwner, setSettingOwner] = useState<{ id: string; name: string } | null>(null);
  const [newRate, setNewRate] = useState("");
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listPayments({ page, limit })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setSummary(r.summary);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function handleSetRate() {
    if (!settingOwner) return;
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert("Geçerli bir oran girin (0-100)");
    api
      .setOwnerCommission(settingOwner.id, rate)
      .then(() => { setSettingOwner(null); setNewRate(""); load(); })
      .catch((e) => alert(e instanceof ApiError ? e.message : "Hata"));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Finans / Ödemeler</h1>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Toplam Gelir</p>
            <p className="text-2xl font-bold text-gray-900">₺{summary.totalRevenue.toLocaleString("tr-TR")}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Platform Komisyonu</p>
            <p className="text-2xl font-bold text-gray-900">₺{summary.totalCommission.toLocaleString("tr-TR")}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Global Komisyon Oranı</p>
            <p className="text-2xl font-bold text-gray-900">%{summary.globalCommissionRate}</p>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Misafir</th>
              <th className="px-4 py-3 text-left">Tekne / Sahip</th>
              <th className="px-4 py-3 text-right">Tutar</th>
              <th className="px-4 py-3 text-right">Komisyon</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-left">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Yükleniyor...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Sonuç bulunamadı</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{p.guestName ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{p.boat.title ?? "—"}</div>
                  <div className="text-xs text-gray-500">{p.boat.owner.fullName ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {p.totalPrice != null ? `₺${p.totalPrice.toLocaleString("tr-TR")}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {p.commission != null ? `₺${p.commission.toLocaleString("tr-TR")} (%${p.commissionRate})` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(p.createdAt).toLocaleDateString("tr-TR")}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSettingOwner({ id: p.boat.owner.id, name: p.boat.owner.fullName ?? p.boat.owner.id })}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Oran Ayarla
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

      {settingOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Komisyon Oranı</h2>
            <p className="mb-3 text-sm text-gray-500">{settingOwner.name}</p>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="Oran (%)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSettingOwner(null)} className="rounded border px-4 py-2 text-sm">Vazgeç</button>
              <button onClick={handleSetRate} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
