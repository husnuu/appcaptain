"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";

type Admin = Awaited<ReturnType<typeof api.listAdmins>>["items"][number];

const ROLE_META: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Süper Admin", color: "bg-purple-100 text-purple-700" },
  ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-700" },
  MODERATOR: { label: "Moderatör", color: "bg-emerald-100 text-emerald-700" },
  SUPPORT: { label: "Destek", color: "bg-gray-100 text-gray-600" },
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"];

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? { label: role, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
}

type CreateForm = { email: string; fullName: string; password: string; role: string };

export default function AdminsPage() {
  const [items, setItems] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({ email: "", fullName: "", password: "", role: "MODERATOR" });
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.listAdmins()
      .then((r) => { setItems(r.items); setTotal(r.total); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.email || !form.fullName || !form.password) { alert("Tüm alanlar zorunludur."); return; }
    setCreating(true);
    try {
      await api.createAdmin(form);
      setShowCreate(false);
      setForm({ email: "", fullName: "", password: "", role: "MODERATOR" });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(id: string, role: string) {
    setUpdatingId(id);
    try {
      await api.updateAdmin(id, { role });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    if (!current && !confirm("Bu yöneticiyi devre dışı bırakmak istiyor musunuz?")) return;
    setUpdatingId(id);
    try {
      if (current) {
        await api.deactivateAdmin(id);
      } else {
        await api.updateAdmin(id, { isActive: true });
      }
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Hata");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yöneticiler</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} admin kullanıcısı</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Yönetici Ekle
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
        {loading ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">Yönetici bulunamadı</p>
        ) : items.map((admin) => (
          <div key={admin.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${!admin.isActive ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 text-sm">{admin.fullName}</p>
                <RoleBadge role={admin.role} />
                {!admin.isActive && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Devre Dışı</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{admin.email}</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {admin._count.auditLogs} işlem · {new Date(admin.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={admin.role}
                disabled={updatingId === admin.id}
                onChange={(e) => void changeRole(admin.id, e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
                ))}
              </select>

              <button
                type="button"
                disabled={updatingId === admin.id}
                onClick={() => void toggleActive(admin.id, admin.isActive)}
                className={`rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                  admin.isActive
                    ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {admin.isActive ? "Devre Dışı" : "Etkinleştir"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Yeni Yönetici</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">E-posta *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Şifre *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Rol açıklamaları: Moderatör — ilan onayı/red; Destek — sadece bilet yönetimi; Admin — finans dahil tüm görünümler; Süper Admin — tam yetki
            </p>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
              <button type="button" disabled={creating} onClick={handleCreate} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {creating ? "Oluşturuluyor…" : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
