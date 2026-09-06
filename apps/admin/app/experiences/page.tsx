"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EXPERIENCE_CATEGORY_LABELS, EXPERIENCE_STATUS_LABELS } from "@getyourboat/shared";
import { api, ApiError } from "../../lib/api";

type Experience = Awaited<ReturnType<typeof api.listExperiences>>["items"][number];

const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "DRAFT", label: "Taslak" },
  { value: "PENDING_REVIEW", label: "İncelemede" },
  { value: "CHANGES_REQUESTED", label: "Değişiklik İstendi" },
  { value: "APPROVED", label: "Onaylandı" },
  { value: "ACTIVE", label: "Yayında" },
  { value: "PAUSED", label: "Duraklatıldı" },
  { value: "REJECTED", label: "Reddedildi" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  CHANGES_REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
};

export default function AdminExperiencesPage() {
  const [items, setItems] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.listExperiences({
          status: status || undefined,
          category: category || undefined,
          search: search || undefined,
          page: p,
          limit,
        });
        setItems(res.items);
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Yüklenemedi");
      } finally {
        setLoading(false);
      }
    },
    [status, category, search]
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [status, category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySearch() {
    setPage(1);
    load(1);
  }

  async function changeStatus(id: string, newStatus: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED", note?: string) {
    setActionBusy(id);
    try {
      await api.updateExperienceStatus(id, { status: newStatus, note });
      await load(page);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem başarısız");
    } finally {
      setActionBusy(null);
    }
  }

  function promptAndChange(id: string, newStatus: "CHANGES_REQUESTED" | "REJECTED", label: string) {
    const note = window.prompt(`${label} notu (kaptana gösterilecek):`);
    if (note === null) return;
    if (note.trim().length < 5) {
      alert("Not en az 5 karakter olmalı.");
      return;
    }
    void changeStatus(id, newStatus, note.trim());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deneyim Yönetimi</h1>
        <span className="text-sm text-gray-500">{total} deneyim</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Deneyim adı, kaptan adı/e-posta veya ID ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
          className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tüm Kategoriler</option>
          {Object.entries(EXPERIENCE_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={applySearch}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ara
        </button>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="py-12 text-center text-gray-400">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-400">Deneyim bulunamadı.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Deneyim</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Kaptan</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Güncellenme</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{exp.title || "(isimsiz taslak)"}</div>
                    <div className="text-xs text-gray-300 font-mono">{exp.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {exp.category ? EXPERIENCE_CATEGORY_LABELS[exp.category as keyof typeof EXPERIENCE_CATEGORY_LABELS] ?? exp.category : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div>{exp.captain.fullName ?? "—"}</div>
                    <div className="text-xs text-gray-400">{exp.captain.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[exp.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {EXPERIENCE_STATUS_LABELS[exp.status as keyof typeof EXPERIENCE_STATUS_LABELS] ?? exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(exp.updatedAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/experiences/${exp.id}`}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Detay
                      </Link>
                      {exp.status === "PENDING_REVIEW" && (
                        <>
                          <button
                            type="button"
                            disabled={actionBusy === exp.id}
                            onClick={() => void changeStatus(exp.id, "APPROVED")}
                            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            disabled={actionBusy === exp.id}
                            onClick={() => promptAndChange(exp.id, "CHANGES_REQUESTED", "Değişiklik isteği")}
                            className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                          >
                            Değişiklik İste
                          </button>
                          <button
                            type="button"
                            disabled={actionBusy === exp.id}
                            onClick={() => promptAndChange(exp.id, "REJECTED", "Reddetme")}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reddet
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
