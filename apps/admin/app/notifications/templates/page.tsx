"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Template = Awaited<ReturnType<typeof api.listNotificationTemplates>>["templates"][number];

const TYPES = [
  { value: "CUSTOM", label: "Özel", color: "bg-gray-100 text-gray-600" },
  { value: "APPROVAL", label: "Onay", color: "bg-emerald-100 text-emerald-700" },
  { value: "REJECTION", label: "Red", color: "bg-red-100 text-red-700" },
  { value: "REMINDER", label: "Hatırlatma", color: "bg-blue-100 text-blue-700" },
  { value: "CAMPAIGN", label: "Kampanya", color: "bg-purple-100 text-purple-700" },
];
const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.value, t]));

const STARTER_TEMPLATES = [
  { name: "Tekne Onay Bildirimi", type: "APPROVAL", subject: "Tekneniz onaylandı 🎉", body: "Merhaba,\n\nTekneniz inceleme sürecini tamamladı ve yayına alındı.\n\nGetYourBoat platformunda başarılı kiralama diliyoruz!\n\nSaygılarımızla,\nGetYourBoat Ekibi" },
  { name: "Tekne Red Bildirimi", type: "REJECTION", subject: "Tekne ilanınız hakkında bilgi", body: "Merhaba,\n\nTekne ilanınız incelenmiş olup eksik/uygunsuz bilgiler tespit edildiğinden yayına alınamamıştır.\n\nLütfen ilanınızı düzenleyerek yeniden gönderiniz.\n\nSaygılarımızla,\nGetYourBoat Ekibi" },
  { name: "Rezervasyon Hatırlatması", type: "REMINDER", subject: "Yaklaşan rezervasyon hatırlatması", body: "Merhaba,\n\nYakında başlayacak bir rezervasyonunuz bulunmaktadır. Teknenizin hazır olduğundan emin olunuz.\n\nSaygılarımızla,\nGetYourBoat Ekibi" },
  { name: "Sezon Kampanyası", type: "CAMPAIGN", subject: "GetYourBoat Yaz Kampanyası 🌊", body: "Merhaba,\n\nBu yaz GetYourBoat'ta özel fırsatlar sizi bekliyor! Teknenizi listeleyerek daha fazla kazanç elde edin.\n\nSaygılarımızla,\nGetYourBoat Ekibi" },
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);

  function load() {
    setLoading(true);
    api.listNotificationTemplates()
      .then((d) => setTemplates(d.templates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.subject?.trim() || !editing.body?.trim()) {
      alert("Ad, konu ve içerik zorunludur.");
      return;
    }
    setFormBusy(true);
    try {
      if (editing.id) {
        await api.updateNotificationTemplate(editing.id, {
          name: editing.name,
          type: editing.type,
          subject: editing.subject,
          body: editing.body,
        });
      } else {
        await api.createNotificationTemplate({
          name: editing.name,
          type: editing.type,
          subject: editing.subject,
          body: editing.body,
        });
      }
      setEditing(null);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu şablonu silmek istiyor musunuz?")) return;
    try { await api.deleteNotificationTemplate(id); load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
  }

  async function addStarter(tpl: typeof STARTER_TEMPLATES[number]) {
    try {
      await api.createNotificationTemplate(tpl);
      load();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
  }

  const grouped = TYPES.map((t) => ({
    ...t,
    items: templates.filter((tmpl) => tmpl.type === t.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bildirim Şablonları</h1>
        <button
          type="button"
          onClick={() => setEditing({ name: "", type: "CUSTOM", subject: "", body: "" })}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Yeni Şablon
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Yükleniyor…</p>
      ) : templates.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <p className="text-gray-400 text-sm mb-3">Henüz şablon eklenmemiş.</p>
            <button
              type="button"
              onClick={() => setEditing({ name: "", type: "CUSTOM", subject: "", body: "" })}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              İlk Şablonu Ekle
            </button>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Hazır Başlangıç Şablonları</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTER_TEMPLATES.map((tpl) => {
                const meta = TYPE_MAP[tpl.type];
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => addStarter(tpl)}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 hover:border-brand-300"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.color ?? "bg-gray-100 text-gray-600"}`}>{meta?.label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{tpl.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{tpl.subject}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {grouped.map((group) => (
            <div key={group.value} className="space-y-2">
              <h2 className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${group.color}`}>{group.label}</span>
                <span className="text-xs text-gray-400">{group.items.length} şablon</span>
              </h2>
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
                {group.items.map((tpl) => (
                  <div key={tpl.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{tpl.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tpl.subject}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{tpl.body}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => setPreview(tpl)} className="rounded-md bg-gray-50 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100">Önizle</button>
                      <button type="button" onClick={() => setEditing({ ...tpl })} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100">Düzenle</button>
                      <button type="button" onClick={() => handleDelete(tpl.id)} className="rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100">Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Also show starters if no APPROVAL/REJECTION/REMINDER/CAMPAIGN exist */}
          {STARTER_TEMPLATES.some((s) => !templates.find((t) => t.name === s.name)) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Hazır Şablonları Ekle</p>
              <div className="flex flex-wrap gap-2">
                {STARTER_TEMPLATES.filter((s) => !templates.find((t) => t.name === s.name)).map((tpl) => {
                  const meta = TYPE_MAP[tpl.type];
                  return (
                    <button key={tpl.name} type="button" onClick={() => addStarter(tpl)} className="rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                      <span className={`inline-block rounded-full px-1.5 py-0.5 mr-1 text-[10px] font-medium ${meta?.color ?? ""}`}>{meta?.label}</span>
                      {tpl.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Editor modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editing.id ? "Şablonu Düzenle" : "Yeni Şablon"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Şablon Adı *</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tür</label>
                <select value={editing.type ?? "CUSTOM"} onChange={(e) => setEditing((p) => ({ ...p!, type: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">E-posta Konusu *</label>
              <input value={editing.subject ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, subject: e.target.value }))} placeholder="Konu satırı" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mesaj İçeriği *</label>
              <textarea rows={8} value={editing.body ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, body: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <p className="mt-1 text-xs text-gray-400">{(editing.body ?? "").length} karakter</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button type="button" disabled={formBusy} onClick={handleSave} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{preview.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Konu: {preview.subject}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-5 py-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {preview.body}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Kapat</button>
              <button type="button" onClick={() => { setEditing({ ...preview }); setPreview(null); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Düzenle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
