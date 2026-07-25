"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Setting = {
  key: string;
  value: string;
  isSet: boolean;
  isSensitive: boolean;
  updatedAt: string | null;
};

const SECTIONS = [
  {
    title: "Platform",
    keys: [
      { key: "platform_name", label: "Platform Adı", type: "text" as const, placeholder: "GetYourBoat" },
      { key: "platform_support_email", label: "Destek E-postası", type: "email" as const, placeholder: "destek@getyourboat.com" },
    ],
  },
  {
    title: "Rezervasyon Kuralları",
    keys: [
      { key: "commission_rate", label: "Global Komisyon Oranı (%)", type: "number" as const, placeholder: "15" },
      { key: "max_booking_days", label: "Maks. Rezervasyon Günü", type: "number" as const, placeholder: "30" },
      { key: "min_booking_hours", label: "Min. Rezervasyon Saati", type: "number" as const, placeholder: "4" },
    ],
  },
  {
    title: "Desteklenen Para Birimleri (JSON dizi)",
    keys: [
      { key: "supported_currencies", label: "Para Birimleri", type: "textarea" as const, placeholder: '["EUR","USD","TRY","GBP"]' },
    ],
  },
  {
    title: "Desteklenen Diller (JSON dizi)",
    keys: [
      { key: "supported_languages", label: "Diller", type: "textarea" as const, placeholder: '["tr","en"]' },
    ],
  },
  {
    title: "Desteklenen Ödeme Yöntemleri (JSON dizi)",
    keys: [
      { key: "supported_payment_methods", label: "Ödeme Yöntemleri", type: "textarea" as const, placeholder: '["CARD","BANK_TRANSFER","IYZICO","STRIPE"]' },
    ],
  },
];

const MAINTENANCE_KEY = "maintenance_mode";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);

  function load() {
    setLoading(true);
    api.getSettings()
      .then((r) => {
        const map: Record<string, Setting> = {};
        const d: Record<string, string> = {};
        r.settings.forEach((s) => {
          map[s.key] = s;
          d[s.key] = s.value;
        });
        setSettings(map);
        setDraft(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const toSave: Record<string, string> = {};
    Object.entries(draft).forEach(([k, v]) => {
      const s = settings[k];
      // Skip sensitive keys that still show masked value
      if (s?.isSensitive && v === "••••••••") return;
      toSave[k] = v;
    });
    try {
      await api.bulkUpdateSettings(toSave);
      setSaved(true);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  const maintenanceOn = draft[MAINTENANCE_KEY] === "true";

  async function toggleMaintenance() {
    if (!maintenanceConfirm && !maintenanceOn) {
      setMaintenanceConfirm(true);
      return;
    }
    setMaintenanceConfirm(false);
    const newVal = maintenanceOn ? "false" : "true";
    setDraft((d) => ({ ...d, [MAINTENANCE_KEY]: newVal }));
    try {
      await api.updateSetting(MAINTENANCE_KEY, newVal);
      setSaved(true);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Hata");
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>

      {/* Bakım Modu */}
      <div className={`rounded-xl border p-5 ${maintenanceOn ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Bakım Modu</h2>
            <p className="text-sm text-gray-500 mt-1">
              Etkinleştirildiğinde platform giriş sayfası hariç tüm isteklere 503 döner. Admin paneli çalışmaya devam eder.
            </p>
            {maintenanceOn && (
              <p className="mt-2 text-sm font-semibold text-red-700">Platform şu an bakım modunda!</p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleMaintenance}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              maintenanceOn
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {maintenanceOn ? "Kapat" : "Etkinleştir"}
          </button>
        </div>

        {maintenanceConfirm && !maintenanceOn && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800 mb-3">
              Bakım modunu etkinleştirmek tüm kullanıcılar için platformu kapatacak. Devam etmek istiyor musunuz?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { void toggleMaintenance(); }}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Evet, Etkinleştir
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{section.title}</h2>
          {section.keys.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
              {type === "textarea" ? (
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={draft[key] ?? ""}
                  placeholder={placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              ) : (
                <input
                  type={type}
                  className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={draft[key] ?? ""}
                  placeholder={placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              )}
              {settings[key]?.updatedAt && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Son güncelleme: {new Date(settings[key]!.updatedAt!).toLocaleString("tr-TR")}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-emerald-600 text-sm font-medium">Ayarlar kaydedildi.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
