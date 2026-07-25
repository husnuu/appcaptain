"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Ticket = Awaited<ReturnType<typeof api.listTickets>>["items"][number];

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "İşlemde",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapatıldı",
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-500",
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Düşük",
  NORMAL: "Normal",
  HIGH: "Yüksek",
  URGENT: "Acil",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-400",
  NORMAL: "text-gray-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600 font-semibold",
};

// New ticket modal
function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ subject: "", body: "", guestEmail: "", guestName: "", guestPhone: "", priority: "NORMAL" });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTicketAdmin({ ...form, guestPhone: form.guestPhone || undefined });
      onCreated();
      onClose();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Yeni Talep Oluştur</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ad Soyad *</label>
            <input required value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">E-posta *</label>
            <input required type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Telefon</label>
            <input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Öncelik</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Konu *</label>
          <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Açıklama *</label>
          <textarea required rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Vazgeç</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">Oluştur</button>
        </div>
      </form>
    </div>
  );
}

export default function SupportPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const limit = 25;

  const load = useCallback(() => {
    setLoading(true);
    api
      .listTickets({ status: status || undefined, priority: priority || undefined, search: search || undefined, assignedTo: assignedTo || undefined, page, limit })
      .then((r) => { setItems(r.items); setTotal(r.total); setCounts(r.counts); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, [status, priority, search, assignedTo, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Destek Talepleri</h1>
        <button type="button" onClick={() => setShowNew(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Yeni Talep
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatus(status === s ? "" : s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${status === s ? STATUS_COLORS[s] + " border-current" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            {label} {counts[s] ? `(${counts[s]})` : ""}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400 self-center">{total} talep</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Konu, isim veya e-posta ara…"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={(e) => { if (e.key === "Enter") load(); }}
        />
        <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">Tüm Öncelikler</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={assignedTo} onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}>
          <option value="">Tüm Atamalar</option>
          <option value="me">Bana Atanmış</option>
          <option value="unassigned">Atanmamış</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Talep</th>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Öncelik</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Atanan</th>
              <th className="px-4 py-3 text-left">Tarih</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Talep bulunamadı</td></tr>
            ) : items.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs">
                  <Link href={`/support/${t.id}`} className="font-medium text-gray-900 hover:text-brand-700 hover:underline line-clamp-1">
                    {t.subject}
                  </Link>
                  <div className="text-xs text-gray-400">
                    #{t.id.slice(-8)} · {t._count.messages} mesaj
                    {t._count.notes > 0 && ` · ${t._count.notes} not`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{t.guestName}</div>
                  <div className="text-xs text-gray-400">{t.guestEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${PRIORITY_COLORS[t.priority] ?? "text-gray-600"}`}>
                    {PRIORITY_LABELS[t.priority] ?? t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {t.assignedTo ? t.assignedTo.fullName : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/support/${t.id}`} className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100">
                    Aç
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">←</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">→</button>
          </div>
        </div>
      )}

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  );
}
