"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type RatesData = Awaited<ReturnType<typeof api.getCommissionRates>>;
type Override = RatesData["overrides"][number];

export default function CommissionPage() {
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global rate edit
  const [globalEdit, setGlobalEdit] = useState(false);
  const [globalInput, setGlobalInput] = useState("");
  const [globalBusy, setGlobalBusy] = useState(false);

  // Per-owner rate modal
  const [ownerModal, setOwnerModal] = useState<{ id: string; name: string; currentRate?: number } | null>(null);
  const [ownerInput, setOwnerInput] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);

  // Remove override
  const [removeBusy, setRemoveBusy] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .getCommissionRates()
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleGlobalSave() {
    const rate = parseFloat(globalInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert("Geçerli bir oran girin (0–100)");
    setGlobalBusy(true);
    try {
      await api.setGlobalCommission(rate);
      setGlobalEdit(false);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setGlobalBusy(false);
    }
  }

  async function handleOwnerSave() {
    if (!ownerModal) return;
    const rate = parseFloat(ownerInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert("Geçerli bir oran girin (0–100)");
    setOwnerBusy(true);
    try {
      await api.setOwnerCommission(ownerModal.id, rate);
      setOwnerModal(null);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setOwnerBusy(false);
    }
  }

  async function handleRemoveOverride(ownerId: string) {
    if (!confirm("Bu özel oranı kaldırıp global orana geri dönmek istiyor musunuz?")) return;
    setRemoveBusy(ownerId);
    try {
      await api.removeOwnerCommission(ownerId);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setRemoveBusy(null);
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Yükleniyor…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Komisyon Oranları</h1>

      {/* Global rate */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Global Komisyon Oranı</h2>
            <p className="text-sm text-gray-500">Özel oranı olmayan tüm tekne sahipleri için geçerli varsayılan oran.</p>
          </div>
          {!globalEdit ? (
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">%{data.globalRate}</span>
              <button
                type="button"
                onClick={() => { setGlobalEdit(true); setGlobalInput(String(data.globalRate)); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Düzenle
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <span className="text-sm text-gray-500">%</span>
              <button type="button" onClick={() => setGlobalEdit(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">İptal</button>
              <button
                type="button"
                disabled={globalBusy}
                onClick={handleGlobalSave}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Per-owner overrides */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Özel Oran Tanımlı Sahipler</h2>
          <span className="text-sm text-gray-400">{data.overrides.length} özel oran</span>
        </div>
        {data.overrides.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">Henüz özel oran tanımlanmamış.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Sahip</th>
                <th className="px-5 py-3 text-right">Global Oran</th>
                <th className="px-5 py-3 text-right">Özel Oran</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.overrides.map((o: Override) => (
                <tr key={o.ownerId} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {o.owner ? (
                      <Link href={`/users/${o.owner.id}`} className="font-medium text-brand-700 hover:underline">
                        {o.owner.fullName ?? o.owner.email}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">{o.ownerId}</span>
                    )}
                    {o.owner?.email && (
                      <div className="text-xs text-gray-400">{o.owner.email}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400">%{data.globalRate}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-semibold text-gray-900">%{o.rate}</span>
                    {o.rate < data.globalRate && (
                      <span className="ml-1 text-xs text-emerald-600">(indirimli)</span>
                    )}
                    {o.rate > data.globalRate && (
                      <span className="ml-1 text-xs text-red-500">(artırılmış)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setOwnerModal({ id: o.ownerId, name: o.owner?.fullName ?? o.ownerId, currentRate: o.rate }); setOwnerInput(String(o.rate)); }}
                        className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={removeBusy === o.ownerId}
                        onClick={() => handleRemoveOverride(o.ownerId)}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        Kaldır
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Tekne sahibine özel oran atamak için <Link href="/users" className="text-brand-600 hover:underline">Kaptan Hesapları</Link> sayfasındaki sahip detay sayfasını kullanın.
      </p>

      {/* Owner rate modal */}
      {ownerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Özel Oran Düzenle</h2>
            <p className="mb-3 text-sm text-gray-500">{ownerModal.name}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">%</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOwnerModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button
                type="button"
                disabled={ownerBusy}
                onClick={handleOwnerSave}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
