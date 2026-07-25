"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Template = Awaited<ReturnType<typeof api.listTemplates>>["templates"][number];

const DEFAULT_CATEGORIES = ["Genel", "Rezervasyon", "Ödeme", "Teknik", "Hesap"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor modal
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  // Preview
  const [preview, setPreview] = useState<Template | null>(null);

  function load() {
    setLoading(true);
    api.listTemplates()
      .then((d) => { setTemplates(d.templates); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.body?.trim()) return alert("Ad ve içerik zorunludur.");
    setFormBusy(true);
    try {
      if (editing.id) {
        await api.updateTemplate(editing.id, { name: editing.name, body: editing.body, category: editing.category ?? null });
      } else {
        await api.createTemplate({ name: editing.name, body: editing.body, category: editing.category || undefined });
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
    try { await api.deleteTemplate(id); load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
  }

  // Group by category
  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category ?? "Kategorisiz";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yanıt Şablonları</h1>
        <button
          type="button"
          onClick={() => setEditing({ name: "", body: "", category: "" })}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Yeni Şablon
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Yükleniyor…</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">Henüz şablon eklenmemiş.</p>
          <button
            type="button"
            onClick={() => setEditing({ name: "", body: "", category: "" })}
            className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-white"
          >
            İlk Şablonu Ekle
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{category}</h2>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
              {items.map((tpl) => (
                <div key={tpl.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{tpl.name}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{tpl.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(tpl)}
                      className="rounded-md bg-gray-50 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      Önizle
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...tpl })}
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl.id)}
                      className="rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Editor modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing.id ? "Şablonu Düzenle" : "Yeni Şablon"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Şablon Adı *</label>
                <input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev!, name: e.target.value }))}
                  placeholder="ör. Rezervasyon İptal - Standart"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                <input
                  list="category-options"
                  value={editing.category ?? ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev!, category: e.target.value }))}
                  placeholder="ör. Rezervasyon"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <datalist id="category-options">
                  {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Şablon İçeriği *</label>
              <textarea
                rows={8}
                value={editing.body ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev!, body: e.target.value }))}
                placeholder="Şablon metnini buraya yazın…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-gray-400">{(editing.body ?? "").length} karakter</p>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button
                type="button"
                disabled={formBusy}
                onClick={handleSave}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Kaydet
              </button>
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
                {preview.category && <p className="text-xs text-gray-400">{preview.category}</p>}
              </div>
              <button type="button" onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {preview.body}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Kapat</button>
              <button
                type="button"
                onClick={() => { setEditing({ ...preview }); setPreview(null); }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Düzenle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
