"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Setting = { key: string; value: string; updatedAt: string };

const KNOWN_KEYS: { key: string; label: string; description: string; type: "text" | "number" | "boolean" }[] = [
  { key: "commission_rate", label: "Global Komisyon Oranı (%)", description: "Platform genelinde uygulanacak komisyon yüzdesi", type: "number" },
  { key: "maintenance_mode", label: "Bakım Modu", description: "true = site bakımda (giriş engellenir)", type: "boolean" },
  { key: "max_booking_days", label: "Maks. Rezervasyon Günü", description: "Tek seferde rezerve edilebilecek maksimum gün sayısı", type: "number" },
  { key: "min_booking_hours", label: "Min. Rezervasyon Saati", description: "Saatlik kiralamada minimum süre", type: "number" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((r) => {
        setSettings(r.settings);
        const d: Record<string, string> = {};
        r.settings.forEach((s) => { d[s.key] = s.value; });
        KNOWN_KEYS.forEach((k) => { if (!(k.key in d)) d[k.key] = ""; });
        setDraft(d);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    api
      .bulkUpdateSettings(draft)
      .then(() => setSaved(true))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Kaydetme hatası"))
      .finally(() => setSaving(false));
  }

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  const unknownKeys = settings.filter((s) => !KNOWN_KEYS.find((k) => k.key === s.key));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Sistem Ayarları</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        {KNOWN_KEYS.map((k) => (
          <div key={k.key}>
            <label className="block text-sm font-medium text-gray-800 mb-0.5">{k.label}</label>
            <p className="text-xs text-gray-400 mb-1">{k.description}</p>
            {k.type === "boolean" ? (
              <select
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                value={draft[k.key] ?? "false"}
                onChange={(e) => setDraft((d) => ({ ...d, [k.key]: e.target.value }))}
              >
                <option value="false">Kapalı</option>
                <option value="true">Açık</option>
              </select>
            ) : (
              <input
                type={k.type === "number" ? "number" : "text"}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm w-48"
                value={draft[k.key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [k.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        {unknownKeys.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Diğer Ayarlar</p>
            {unknownKeys.map((s) => (
              <div key={s.key} className="mb-3">
                <label className="block text-sm font-medium text-gray-800 mb-1 font-mono">{s.key}</label>
                <input
                  type="text"
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm w-64"
                  value={draft[s.key] ?? s.value}
                  onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Kaydedildi.</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
