"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Setting = {
  key: string;
  value: string;
  isSet: boolean;
  isSensitive: boolean;
  updatedAt: string | null;
};

const API_KEY_GROUPS = [
  {
    title: "Stripe",
    description: "Online kart ödemeleri için Stripe API anahtarları",
    keys: [
      { key: "stripe_public_key", label: "Public Key", sensitive: false, placeholder: "pk_live_..." },
      { key: "stripe_secret_key", label: "Secret Key", sensitive: true, placeholder: "sk_live_..." },
    ],
  },
  {
    title: "iyzico",
    description: "Türk ödeme altyapısı için iyzico entegrasyonu",
    keys: [
      { key: "iyzico_merchant_id", label: "Merchant ID", sensitive: false, placeholder: "merchant_..." },
      { key: "iyzico_api_key", label: "API Key", sensitive: true, placeholder: "sandbox-..." },
      { key: "iyzico_secret_key", label: "Secret Key", sensitive: true, placeholder: "sandbox-..." },
    ],
  },
  {
    title: "Google Maps",
    description: "Harita ve adres otomatik tamamlama için Google Maps API",
    keys: [
      { key: "google_maps_api_key", label: "API Key", sensitive: true, placeholder: "AIzaSy..." },
    ],
  },
];

export default function ApiKeysPage() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getSettings()
      .then((r) => {
        const map: Record<string, Setting> = {};
        r.settings.forEach((s) => { map[s.key] = s; });
        setSettings(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveKey(key: string) {
    const value = editing[key];
    if (value === undefined) return;
    setSaving((s) => ({ ...s, [key]: true }));
    setError((e) => ({ ...e, [key]: "" }));
    try {
      await api.updateSetting(key, value);
      setSaved((s) => ({ ...s, [key]: true }));
      setEditing((e) => { const next = { ...e }; delete next[key]; return next; });
      const res = await api.getSettings();
      const map: Record<string, Setting> = {};
      res.settings.forEach((s) => { map[s.key] = s; });
      setSettings(map);
    } catch (e) {
      setError((err) => ({ ...err, [key]: e instanceof ApiError ? e.message : "Hata" }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Entegrasyonları</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gizli anahtarlar veritabanında şifresiz saklanır. Yalnızca yetkilendirme ekibinin erişimine açın.
        </p>
      </div>

      {API_KEY_GROUPS.map((group) => (
        <div key={group.title} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
            <h2 className="font-semibold text-gray-900">{group.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
          </div>
          <div className="divide-y divide-gray-50 px-5">
            {group.keys.map(({ key, label, sensitive, placeholder }) => {
              const s = settings[key];
              const isEditing = key in editing;
              const isRevealed = revealed.has(key);

              return (
                <div key={key} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-medium text-gray-800">{label}</label>
                        {sensitive && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Gizli</span>
                        )}
                        {s?.isSet && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Ayarlandı</span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type={sensitive && !isRevealed ? "password" : "text"}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                            value={editing[key]}
                            placeholder={placeholder}
                            onChange={(e) => setEditing((ed) => ({ ...ed, [key]: e.target.value }))}
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            disabled={saving[key]}
                            onClick={() => void saveKey(key)}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                          >
                            {saving[key] ? "…" : "Kaydet"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing((e) => { const n = { ...e }; delete n[key]; return n; })}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-mono text-gray-500">
                            {s?.isSet ? (sensitive ? "••••••••••••" : s.value) : <span className="text-gray-300 italic">Ayarlanmamış</span>}
                          </span>
                          {sensitive && s?.isSet && !isRevealed && (
                            <button
                              type="button"
                              onClick={() => setRevealed((r) => new Set([...r, key]))}
                              className="text-xs text-brand-600 hover:underline"
                            >
                              Göster
                            </button>
                          )}
                        </div>
                      )}

                      {error[key] && <p className="text-xs text-red-600 mt-1">{error[key]}</p>}
                      {saved[key] && !isEditing && <p className="text-xs text-emerald-600 mt-1">Kaydedildi</p>}
                      {s?.updatedAt && !isEditing && (
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(s.updatedAt).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setEditing((e) => ({ ...e, [key]: "" }))}
                        className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        {s?.isSet ? "Değiştir" : "Ayarla"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
