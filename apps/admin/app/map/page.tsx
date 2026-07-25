"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type MapData = Awaited<ReturnType<typeof api.getMapBoats>>;
type Boat = MapData["boats"][number];

const BOAT_TYPE_LABELS: Record<string, string> = {
  motoryacht: "Motoryat",
  sailboat: "Yelkenli",
  gulet: "Gulet",
  catamaran: "Katamaran",
  rib: "RIB",
  speedboat: "Sürat teknesi",
};

function CountryBar({ country, count, max }: { country: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-gray-700 truncate">{country}</span>
      <div className="flex-1 rounded-full bg-gray-100 h-2">
        <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-medium text-gray-800">{count}</span>
    </div>
  );
}

export default function MapPage() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Boat | null>(null);
  const [viewMode, setViewMode] = useState<"country" | "city" | "list">("country");

  useEffect(() => {
    api.getMapBoats()
      .then((r) => { setData(r); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.boats.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.title ?? "").toLowerCase().includes(q) ||
      (b.locationLabel ?? "").toLowerCase().includes(q) ||
      (b.owner.fullName ?? "").toLowerCase().includes(q)
    );
  }) ?? [];

  const maxCountryCount = Math.max(1, ...(data?.byCountry.map((c) => c.count) ?? [1]));

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor…</div>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harita Görünümü</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.total} aktif ilan
            {data.withCoords > 0 && (
              <> · {data.withCoords} koordinatlı</>
            )}
          </p>
        </div>

        {data.withCoords === 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700 max-w-xs">
            Gerçek harita için tekne koordinatları gereklidir.
            <code className="block mt-1 font-mono text-[10px]">latitude + longitude alanları</code>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Aktif İlan", value: data.total },
          { label: "Koordinatlı", value: data.withCoords },
          { label: "Ülke", value: data.byCountry.length },
          { label: "Şehir", value: data.byCity.length },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          {(["country", "city", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                viewMode === mode ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {mode === "country" ? "Ülkeye Göre" : mode === "city" ? "Şehire Göre" : "Liste"}
            </button>
          ))}
        </div>

        {viewMode === "list" && (
          <input
            type="text"
            placeholder="İlan, şehir veya kaptan ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}
      </div>

      {viewMode === "country" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ülkelere Göre Dağılım</h2>
          {data.byCountry.length === 0 ? (
            <p className="text-sm text-gray-400">Ülke verisi bulunamadı — teknelere lokasyon bilgisi ekleyin.</p>
          ) : (
            data.byCountry.map((c) => (
              <CountryBar key={c.country} country={c.country} count={c.count} max={maxCountryCount} />
            ))
          )}
        </div>
      )}

      {viewMode === "city" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100">
            {data.byCity.length === 0 ? (
              <div className="col-span-4 bg-white p-8 text-center text-sm text-gray-400">
                Şehir verisi bulunamadı — teknelere lokasyon bilgisi ekleyin.
              </div>
            ) : (
              data.byCity.map((c) => (
                <div key={c.city} className="bg-white p-4 text-center">
                  <p className="text-xl font-bold text-gray-900">{c.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.city}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">İlan</th>
                <th className="px-4 py-3 text-left">Tür</th>
                <th className="px-4 py-3 text-left">Lokasyon</th>
                <th className="px-4 py-3 text-left">Kaptan</th>
                <th className="px-4 py-3 text-right">Koord.</th>
                <th className="px-4 py-3 text-right">Yorum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</td></tr>
              ) : filtered.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(b)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-[200px] truncate">{b.title ?? "İsimsiz"}</p>
                    <p className="text-xs text-gray-400">#{b.id.slice(-8)}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.boatTypeKey ? (BOAT_TYPE_LABELS[b.boatTypeKey] ?? b.boatTypeKey) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.locationLabel ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{b.owner.fullName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{b.owner.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.latitude && b.longitude ? (
                      <span className="text-xs font-mono text-emerald-600">
                        {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Boat detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h2 className="font-semibold text-gray-900 truncate">{selected.title ?? "İsimsiz"}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Tür</p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {selected.boatTypeKey ? (BOAT_TYPE_LABELS[selected.boatTypeKey] ?? selected.boatTypeKey) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Yorumlar</p>
                  <p className="font-medium text-gray-900 mt-0.5">{selected.reviewCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Rezervasyonlar</p>
                  <p className="font-medium text-gray-900 mt-0.5">{selected.bookingCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Lokasyon</p>
                  <p className="font-medium text-gray-900 mt-0.5 truncate">{selected.locationLabel ?? "—"}</p>
                </div>
              </div>
              {selected.latitude && selected.longitude && (
                <div className="rounded-lg border border-gray-100 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Koordinatlar</p>
                  <p className="font-mono text-xs text-gray-800">
                    {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Kaptan</p>
                <p className="font-medium text-gray-900">{selected.owner.fullName ?? "—"}</p>
                <p className="text-xs text-gray-400">{selected.owner.email ?? ""}</p>
              </div>
              <a
                href={`/boats/${selected.id}`}
                className="block rounded-lg border border-gray-200 px-4 py-2 text-center text-sm text-brand-600 hover:bg-brand-50"
              >
                İlan Detayına Git →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
