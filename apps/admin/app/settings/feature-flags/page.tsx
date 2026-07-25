"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Flag = Awaited<ReturnType<typeof api.listFeatureFlags>>["flags"][number];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingName, setTogglingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.listFeatureFlags()
      .then((r) => { setFlags(r.flags); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(name: string, currentEnabled: boolean) {
    setTogglingName(name);
    try {
      await api.toggleFeatureFlag(name, !currentEnabled);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setTogglingName(null);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-400 mt-0.5">Modülleri canlıda açıp kapatın. Değişiklikler anında etkinleşir.</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Yükleniyor…</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
          {flags.map((flag) => (
            <div key={flag.name} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{flag.label}</p>
                  {flag.isDefault && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">Varsayılan</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{flag.description}</p>
                <p className="text-xs text-gray-300 font-mono mt-0.5">{flag.name}</p>
              </div>

              <button
                type="button"
                disabled={togglingName === flag.name}
                onClick={() => void toggle(flag.name, flag.enabled)}
                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                  flag.enabled ? "bg-brand-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    flag.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <strong>Not:</strong> Feature flag değişiklikleri uygulama yeniden başlatılmadan etkinleşir, ancak önbelleğe alınmış sayfalar eski durumu gösterebilir.
      </div>
    </div>
  );
}
